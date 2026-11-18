import { prisma } from '../config/prisma';
import { providerRegistry } from '../providers/base/ProviderRegistry';
import { normalizeAuction, validateAuction } from './normalizer';
import { upsertAuction } from './deduplicator';
import { matchAuctionWithAlerts } from '../services/alertService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { RawAuction } from '../types/provider';

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

const runningSources = new Set<string>();

/**
 * @param fetcher optional replacement for `provider.fetchAuctions()`, e.g. an admin-assisted full
 *   fetch. Everything else (job record, per-source lock, normalise, upsert, alert matching) is shared.
 */
export async function runScraperPipeline(sourceCode: string, fetcher?: () => Promise<RawAuction[]>): Promise<PipelineSummary> {
  const upperCode = sourceCode.toUpperCase();
  if (runningSources.has(upperCode)) {
    throw new AppError(`Ingestion for [${upperCode}] is already running`, 409, 'SYNC_IN_PROGRESS');
  }
  runningSources.add(upperCode);
  try {
    return await runScraperPipelineUnlocked(upperCode, fetcher);
  } finally {
    runningSources.delete(upperCode);
  }
}

async function runScraperPipelineUnlocked(upperCode: string, fetcher?: () => Promise<RawAuction[]>): Promise<PipelineSummary> {
  const startTime = Date.now();
  logger.info(`[Pipeline] Starting data ingestion pipeline for source: [${upperCode}]`);

  // 1. Resolve provider first so unknown codes never create junk source rows
  const provider = providerRegistry.get(upperCode);
  if (!provider) {
    throw new AppError(`No registered provider for source [${upperCode}]`, 404, 'SOURCE_NOT_FOUND');
  }

  const sourceRecord = await prisma.auctionSource.upsert({
    where: { code: upperCode },
    update: {
      name: provider.sourceName,
      baseUrl: provider.baseUrl
    },
    create: {
      code: upperCode,
      name: provider.sourceName,
      baseUrl: provider.baseUrl,
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
    // 3. Fetch raw auction batch
    const rawAuctions = fetcher ? await fetcher() : await provider.fetchAuctions();
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
  // Run every registered provider whose source has not been disabled by an admin.
  const disabled = await prisma.auctionSource.findMany({
    where: { enabled: false },
    select: { code: true }
  });
  const disabledCodes = new Set(disabled.map((s) => s.code));

  const summaries: PipelineSummary[] = [];
  for (const code of providerRegistry.getRegisteredCodes()) {
    if (disabledCodes.has(code)) continue;
    summaries.push(await runScraperPipeline(code));
  }
  return summaries;
}
