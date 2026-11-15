import cron from 'node-cron';
import { AuctionStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { runAllEnabledScrapers } from '../scraper/pipeline';
import { calculateAuctionStatus } from '../utils/statusCalculator';
import { logger } from '../utils/logger';

export class ScraperScheduler {
  private static instance: ScraperScheduler;
  private isRunning = false;

  public static getInstance(): ScraperScheduler {
    if (!ScraperScheduler.instance) {
      ScraperScheduler.instance = new ScraperScheduler();
    }
    return ScraperScheduler.instance;
  }

  public init(): void {
    if (!env.SCRAPER_ENABLED) {
      logger.info('Scraper scheduler is disabled via SCRAPER_ENABLED=false.');
      return;
    }

    const intervalMinutes = env.SCRAPE_INTERVAL_MINUTES || 30;
    const cronExpression = `*/${intervalMinutes} * * * *`;

    logger.info(`Initializing scheduler: Sync job runs every ${intervalMinutes} min [${cronExpression}].`);

    // 1. Data Ingestion Cron
    cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        logger.warn('Previous sync job is still in progress. Skipping cycle.');
        return;
      }

      this.isRunning = true;
      try {
        logger.info('Triggering scheduled auction sync cycle...');
        await runAllEnabledScrapers();
      } catch (error) {
        logger.error(`Scheduled sync failed: ${(error as Error).message}`);
      } finally {
        this.isRunning = false;
      }
    });

    // 2. Real-time Status Recalculation Cron (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.syncAuctionStatuses();
      } catch (error) {
        logger.error(`Status sync failed: ${(error as Error).message}`);
      }
    });

    // 3. Daily Database Cleanup Job (Runs at 03:00 AM)
    cron.schedule('0 3 * * *', async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await prisma.scrapeJob.deleteMany({
          where: {
            startedAt: { lt: thirtyDaysAgo }
          }
        });
        logger.info(`Cleaned up ${result.count} obsolete scrape job logs older than 30 days.`);
      } catch (error) {
        logger.error(`ScrapeJob log cleanup error: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Recalculates statuses for all non-closed auctions
   */
  public async syncAuctionStatuses(): Promise<number> {
    const activeAuctions = await prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'LIVE', 'ENDING_SOON'] }
      },
      select: { id: true, startTime: true, endTime: true, status: true }
    });

    const now = new Date();

    // Group ids by their new status so we issue one UPDATE per status instead of one per row.
    const idsByStatus = new Map<AuctionStatus, string[]>();
    for (const a of activeAuctions) {
      const calculated = calculateAuctionStatus(a.startTime, a.endTime, now);
      if (calculated !== a.status) {
        const ids = idsByStatus.get(calculated) ?? [];
        ids.push(a.id);
        idsByStatus.set(calculated, ids);
      }
    }

    let updatedCount = 0;
    for (const [status, ids] of idsByStatus) {
      const result = await prisma.auction.updateMany({
        where: { id: { in: ids } },
        data: { status }
      });
      updatedCount += result.count;
    }

    if (updatedCount > 0) {
      logger.info(`Synchronized ${updatedCount} auction statuses.`);
    }

    return updatedCount;
  }
}

export const scraperScheduler = ScraperScheduler.getInstance();
