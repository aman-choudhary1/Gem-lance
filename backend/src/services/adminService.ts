import { prisma } from '../config/prisma';
import { providerRegistry } from '../providers/base/ProviderRegistry';
import { runScraperPipeline } from '../scraper/pipeline';

export class AdminService {
  public async getDashboardOverview() {
    const [
      totalSources,
      totalAuctions,
      liveAuctions,
      totalUsers,
      totalAlerts,
      recentJobs,
      providerHealths
    ] = await Promise.all([
      prisma.auctionSource.count(),
      prisma.auction.count(),
      prisma.auction.count({ where: { status: 'LIVE' } }),
      prisma.user.count(),
      prisma.auctionAlert.count(),
      prisma.scrapeJob.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: { source: { select: { code: true, name: true } } }
      }),
      providerRegistry.checkAllHealth()
    ]);

    const sources = await prisma.auctionSource.findMany({
      include: {
        _count: { select: { auctions: true, scrapeJobs: true } }
      }
    });

    return {
      metrics: {
        totalSources,
        totalAuctions,
        liveAuctions,
        totalUsers,
        totalAlerts
      },
      sources: sources.map((src) => {
        const health = providerHealths.find((h) => h.source === src.code);
        return {
          id: src.id,
          code: src.code,
          name: src.name,
          baseUrl: src.baseUrl,
          enabled: src.enabled,
          auctionCount: src._count.auctions,
          jobCount: src._count.scrapeJobs,
          health: health || { source: src.code, healthy: false, message: 'Unregistered' }
        };
      }),
      recentJobs
    };
  }

  public async getScraperStatus() {
    const healths = await providerRegistry.checkAllHealth();
    const jobs = await prisma.scrapeJob.findMany({
      take: 20,
      orderBy: { startedAt: 'desc' },
      include: { source: { select: { code: true, name: true } } }
    });

    return {
      providers: healths,
      recentJobs: jobs
    };
  }

  public async getScrapeJobs(limit = 50) {
    return prisma.scrapeJob.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        source: { select: { code: true, name: true } }
      }
    });
  }

  public async triggerManualScrape(sourceCode: string) {
    return runScraperPipeline(sourceCode);
  }
}

export const adminService = new AdminService();
