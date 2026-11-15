import { app } from './app';
import { env, mockDataEnabled, liveDataEnabled } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { providerRegistry } from './providers/base/ProviderRegistry';
import { MockAuctionProvider } from './providers/mock/MockAuctionProvider';
import { GemAuctionProvider } from './providers/gem/GemAuctionProvider';
import { GemBidsProvider } from './providers/gem/GemBidsProvider';
import { MstcAuctionProvider } from './providers/mstc/MstcAuctionProvider';
import { GepnicProvider } from './providers/gepnic/GepnicProvider';
import { GEPNIC_PORTALS } from './providers/gepnic/gepnicConfig';
import { CgstateAuctionProvider } from './providers/cgstate/CgstateAuctionProvider';
import { scraperScheduler } from './jobs/scheduler';
import { runScraperPipeline } from './scraper/pipeline';

async function bootstrap() {
  try {
    logger.info(`Starting AuctionLens Backend Server...`);

    // 1. Register Data Providers in ProviderRegistry (controlled by DATA_PROVIDER=mock|live|all)
    logger.info(`Data mode: ${env.DATA_PROVIDER} (sample data ${mockDataEnabled ? 'ON' : 'OFF'}, live portals ${liveDataEnabled ? 'ON' : 'OFF'})`);

    if (mockDataEnabled) {
      providerRegistry.register(new MockAuctionProvider());
    }

    if (liveDataEnabled) {
      providerRegistry.register(new GemAuctionProvider());
      providerRegistry.register(new GemBidsProvider());
      providerRegistry.register(new MstcAuctionProvider());
      providerRegistry.register(new CgstateAuctionProvider());

      // Register all GePNIC Central, State, and UT portals
      for (const portalConfig of GEPNIC_PORTALS) {
        providerRegistry.register(new GepnicProvider(portalConfig));
      }
    }

    // 2. Initialize Database Connection
    await prisma.$connect();
    logger.info('Database connection verified.');

    // 3. Initialize background scheduler
    scraperScheduler.init();

    // 4. Auto-populate initial data on cold start if table is empty
    const auctionCount = await prisma.auction.count();
    if (auctionCount === 0) {
      const initialSources = ['MOCK', 'GEM', 'CPPP'].filter((code) => providerRegistry.get(code));
      logger.info(`Running initial ingestion from registered providers (${initialSources.join(', ')})...`);
      try {
        for (const code of initialSources) {
          await runScraperPipeline(code);
        }
        logger.info('Initial data ingestion complete.');
      } catch (ingestErr) {
        logger.warn(`Initial ingestion note: ${(ingestErr as Error).message}`);
      }
    }

    // 5. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`AuctionLens REST API running at: http://localhost:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful Shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database disconnected. Process exit.');
        process.exit(0);
      });

      // Force shutdown after 10s if hanging
      setTimeout(() => {
        logger.error('Forceful shutdown timeout expired.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
