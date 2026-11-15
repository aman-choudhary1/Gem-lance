import { prisma } from '../config/prisma';
import { providerRegistry } from '../providers/base/ProviderRegistry';
import { normalizeAuction, validateAuction } from './normalizer';
import { upsertAuction } from './deduplicator';
import { matchAuctionWithAlerts } from '../services/alertService';
import { logger } from '../utils/logger';

export interface PipelineSummary {
  sourceCode: string;
  jobId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  durationMs: number;
  errorMessage?: string;
}

export async function runScraperPipeline(sourceCode: string): Promise<PipelineSummary> {
  const startTime = Date.now();
  const upperCode = sourceCode.toUpperCase();
  logger.info(`[Pipeline] Starting data ingestion pipeline for source: [${upperCode}]`);

  // 1. Resolve source record from DB
  const provider = providerRegistry.get(upperCode);
  const sourceRecord = await prisma.auctionSource.upsert({
    where: { code: upperCode },
    update: {
      name: provider?.sourceName,
      baseUrl: provider?.baseUrl
    },
    create: {
      code: upperCode,
      name: provider?.sourceName || `${upperCode} Auction Portal`,
      baseUrl: provider?.baseUrl || (upperCode === 'GEM' ? 'https://forwardauction.gem.gov.in' : 'https://auctionlens.internal'),
      enabled: true
    }
  });

  if (!sourceRecord.enabled) {
    logger.warn(`[Pipeline] Source [${upperCode}] is currently disabled in database.`);
    return {
      sourceCode: upperCode,
      jobId: 'DISABLED',
      status: 'PARTIAL',
      recordsFound: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      durationMs: Date.now() - startTime,
      errorMessage: 'Source is disabled'
    };
  }

  // 2. Create ScrapeJob record
  const job = await prisma.scrapeJob.create({
    data: {
      sourceId: sourceRecord.id,
      status: 'RUNNING',
      startedAt: new Date()
    }
  });

  let recordsFound = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  let errorMessage: string | undefined;

  try {
    // 3. Resolve Provider from Registry
    const provider = providerRegistry.get(upperCode);
    if (!provider) {
      throw new Error(`No registered provider found for code: [${upperCode}]`);
    }

    // 4. Fetch raw auction batch
    const rawAuctions = await provider.fetchAuctions();
    recordsFound = rawAuctions.length;
    logger.info(`[Pipeline] Provider [${upperCode}] returned ${recordsFound} records.`);

    // 5. Process each record through Normalizer -> Validator -> Deduplicator -> Alert Matcher
    for (const raw of rawAuctions) {
      try {
        const normalized = normalizeAuction(raw, upperCode);
        const isValid = validateAuction(normalized);

        if (!isValid) {
          recordsFailed++;
          continue;
        }

        const result = await upsertAuction(normalized, sourceRecord.id);

        if (result.action === 'CREATED') {
          recordsCreated++;
          if (result.auctionId) {
            // Trigger alert matching asynchronously
            matchAuctionWithAlerts(result.auctionId).catch((err) =>
              logger.error(`Alert match error: ${err.message}`)
            );
          }
        } else if (result.action === 'UPDATED') {
          recordsUpdated++;
        } else {
          recordsFailed++;
        }
      } catch (itemErr) {
        recordsFailed++;
        logger.error(`Failed processing item for [${upperCode}]: ${(itemErr as Error).message}`);
      }
    }

    const jobStatus = recordsFailed === 0 ? 'SUCCESS' : recordsCreated + recordsUpdated > 0 ? 'PARTIAL' : 'FAILED';

    // 6. Update ScrapeJob
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        completedAt: new Date(),
        status: jobStatus,
        recordsFound,
        recordsCreated,
        recordsUpdated,
        recordsFailed
      }
    });

    logger.info(`[Pipeline] Finished [${upperCode}]: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsFailed} failed.`);

    return {
      sourceCode: upperCode,
      jobId: job.id,
      status: jobStatus,
      recordsFound,
      recordsCreated,
      recordsUpdated,
      recordsFailed,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown pipeline error';
    logger.error(`[Pipeline] Fatal error for [${upperCode}]: ${errorMessage}`);

    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        completedAt: new Date(),
        status: 'FAILED',
        recordsFound,
        recordsCreated,
        recordsUpdated,
        recordsFailed: recordsFound - (recordsCreated + recordsUpdated),
        errorMessage
      }
    });

    return {
      sourceCode: upperCode,
      jobId: job.id,
      status: 'FAILED',
      recordsFound,
      recordsCreated,
      recordsUpdated,
      recordsFailed,
      durationMs: Date.now() - startTime,
      errorMessage
    };
  }
}

export async function runAllEnabledScrapers(): Promise<PipelineSummary[]> {
  const sources = await prisma.auctionSource.findMany({
    where: { enabled: true }
  });

  const summaries: PipelineSummary[] = [];
  for (const src of sources) {
    const summary = await runScraperPipeline(src.code);
    summaries.push(summary);
  }
  return summaries;
}
