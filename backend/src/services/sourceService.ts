import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { runScraperPipeline, PipelineSummary } from '../scraper/pipeline';
import { providerRegistry } from '../providers/base/ProviderRegistry';
import { GEPNIC_PORTALS } from '../providers/gepnic/gepnicConfig';
import { AuctionStatus } from '@prisma/client';

const MAX_BATCH_SYNC_SOURCES = 40;

export interface SiteAnalyticsItem {
  id: string;
  code: string;
  name: string;
  baseUrl: string | null;
  enabled: boolean;
  region: string;
  state: string;
  auctionCount: number;
  liveAuctionCount: number;
  totalLotValue: number;
  latestJob: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsFailed: number;
    errorMessage: string | null;
    durationMs: number | null;
  } | null;
  health: {
    healthy: boolean;
    responseTimeMs?: number;
    message?: string;
  };
}

export interface AnalyticsReportData {
  summary: {
    totalAuctions: number;
    liveAuctions: number;
    upcomingAuctions: number;
    endingSoonAuctions: number;
    totalLotValue: number;
    totalSources: number;
    activeSources: number;
    totalScrapeJobs: number;
    totalRecordsCreated: number;
    lastIngestionAt: Date | null;
  };
  sites: SiteAnalyticsItem[];
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { name: string; count: number }[];
  stateBreakdown: { state: string; count: number }[];
  recentJobs: any[];
}

export class SourceService {
  public async getAllSources() {
    return prisma.auctionSource.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: { select: { auctions: true } }
      }
    });
  }

  public async getSourceByCode(code: string) {
    const source = await prisma.auctionSource.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { auctions: true, scrapeJobs: true } }
      }
    });

    if (!source) {
      throw new AppError('Auction source not found', 404, 'SOURCE_NOT_FOUND');
    }

    return source;
  }

  public async toggleSource(id: string, enabled: boolean) {
    return prisma.auctionSource.update({
      where: { id },
      data: { enabled }
    });
  }

  /**
   * Generates comprehensive analytics and reporting across all sites & bids
   */
  public async getAnalyticsReport(): Promise<AnalyticsReportData> {
    const now = new Date();

    const [
      totalAuctions,
      liveCount,
      endingSoonCount,
      upcomingCount,
      valueAgg,
      totalSources,
      totalScrapeJobs,
      jobsAgg,
      allSources,
      statusGroups,
      categoryGroups,
      stateGroups,
      recentJobs,
      healthList,
      liveBySourceGroups,
      valueBySourceGroups
    ] = await Promise.all([
      prisma.auction.count(),
      prisma.auction.count({ where: { status: AuctionStatus.LIVE } }),
      prisma.auction.count({ where: { status: AuctionStatus.ENDING_SOON } }),
      prisma.auction.count({ where: { status: AuctionStatus.UPCOMING } }),
      prisma.auction.aggregate({ _sum: { startPrice: true } }),
      prisma.auctionSource.count(),
      prisma.scrapeJob.count(),
      prisma.scrapeJob.aggregate({ _sum: { recordsCreated: true } }),
      prisma.auctionSource.findMany({
        orderBy: { code: 'asc' },
        include: {
          _count: { select: { auctions: true } },
          scrapeJobs: {
            orderBy: { startedAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.auction.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.category.findMany({
        select: {
          name: true,
          _count: { select: { auctions: true } }
        },
        orderBy: { auctions: { _count: 'desc' } },
        take: 8
      }),
      // Count auctions (not location rows) per state
      prisma.location.findMany({
        select: { state: true, _count: { select: { auctions: true } } }
      }),
      prisma.scrapeJob.findMany({
        take: 20,
        orderBy: { startedAt: 'desc' },
        include: {
          source: { select: { code: true, name: true } }
        }
      }),
      providerRegistry.checkAllHealth().catch(() => []),
      prisma.auction.groupBy({
        by: ['sourceId'],
        where: { status: { in: [AuctionStatus.LIVE, AuctionStatus.ENDING_SOON] } },
        _count: { id: true }
      }),
      prisma.auction.groupBy({
        by: ['sourceId'],
        _sum: { startPrice: true }
      })
    ]);

    const liveBySource = new Map(liveBySourceGroups.map((g) => [g.sourceId, g._count.id]));
    const valueBySource = new Map(valueBySourceGroups.map((g) => [g.sourceId, Number(g._sum.startPrice || 0)]));

    const stateTotals = new Map<string, number>();
    for (const loc of stateGroups) {
      const key = loc.state || 'Other';
      stateTotals.set(key, (stateTotals.get(key) || 0) + loc._count.auctions);
    }
    const stateBreakdown = Array.from(stateTotals, ([state, count]) => ({ state, count }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Map portal configs for regional & state classification
    const portalConfigMap = new Map(GEPNIC_PORTALS.map((p) => [p.sourceCode, p]));

    const sites: SiteAnalyticsItem[] = allSources.map((s) => {
      const config = portalConfigMap.get(s.code);
      const latestJob = s.scrapeJobs[0] || null;
      const health = healthList.find((h) => h.source === s.code);

      let durationMs: number | null = null;
      if (latestJob && latestJob.completedAt) {
        durationMs = latestJob.completedAt.getTime() - latestJob.startedAt.getTime();
      }

      let region = 'Other';
      let state = 'India';
      if (s.code === 'GEM' || s.code === 'GEM_BIDS' || s.code === 'CPPP' || s.code === 'DEFPROC') {
        region = 'Central';
        state = 'Central / Pan India';
      } else if (s.code === 'CGSTATE') {
        region = 'State';
        state = 'Chhattisgarh';
      } else if (config) {
        region = config.region;
        state = config.stateName;
      } else if (s.code === 'MSTC' || s.code === 'BANK' || s.code === 'PSU') {
        region = 'PSU / Bank';
        state = 'National';
      }

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        baseUrl: s.baseUrl,
        enabled: s.enabled,
        region,
        state,
        auctionCount: s._count.auctions,
        liveAuctionCount: liveBySource.get(s.id) || 0,
        totalLotValue: valueBySource.get(s.id) || 0,
        latestJob: latestJob
          ? {
              id: latestJob.id,
              status: latestJob.status,
              startedAt: latestJob.startedAt,
              completedAt: latestJob.completedAt,
              recordsFound: latestJob.recordsFound,
              recordsCreated: latestJob.recordsCreated,
              recordsUpdated: latestJob.recordsUpdated,
              recordsFailed: latestJob.recordsFailed,
              errorMessage: latestJob.errorMessage,
              durationMs
            }
          : null,
        health: health
          ? {
              healthy: health.healthy,
              responseTimeMs: health.responseTimeMs,
              message: health.message
            }
          : {
              healthy: false,
              message: providerRegistry.get(s.code)
                ? 'Health not yet checked'
                : 'Provider not active in the current DATA_PROVIDER mode'
            }
      };
    });

    const activeSources = sites.filter((s) => s.auctionCount > 0).length;
    const lastJob = recentJobs[0];

    return {
      summary: {
        totalAuctions,
        liveAuctions: liveCount + endingSoonCount,
        upcomingAuctions: upcomingCount,
        endingSoonAuctions: endingSoonCount,
        totalLotValue: Number(valueAgg._sum.startPrice || 0),
        totalSources,
        activeSources,
        totalScrapeJobs,
        totalRecordsCreated: jobsAgg._sum.recordsCreated || totalAuctions,
        lastIngestionAt: lastJob ? lastJob.startedAt : null
      },
      sites,
      statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count.id })),
      categoryBreakdown: categoryGroups.map((c) => ({ name: c.name, count: c._count.auctions })),
      stateBreakdown,
      recentJobs
    };
  }

  /**
   * Triggers live tender fetch for a specific site
   */
  public async triggerSync(sourceCode: string): Promise<PipelineSummary> {
    return runScraperPipeline(sourceCode);
  }

  /**
   * Triggers batch sync across multiple priority sites
   */
  public async triggerBatchSync(codes?: string[]): Promise<PipelineSummary[]> {
    const requested = Array.isArray(codes)
      ? codes.filter((c): c is string => typeof c === 'string' && c.trim() !== '').map((c) => c.trim().toUpperCase())
      : [];
    const defaults = ['CPPP', 'MAHA_TENDERS', 'UP_TENDERS', 'MP_TENDERS', 'DEFPROC', 'GEM_BIDS'];
    const targetCodes = [...new Set(requested.length > 0 ? requested : defaults)]
      .filter((c) => providerRegistry.get(c))
      .slice(0, MAX_BATCH_SYNC_SOURCES);

    const results: PipelineSummary[] = [];
    for (const code of targetCodes) {
      try {
        const summary = await runScraperPipeline(code);
        results.push(summary);
      } catch (err) {
        results.push({
          sourceCode: code,
          jobId: 'ERR',
          status: 'FAILED',
          recordsFound: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          durationMs: 0,
          errorMessage: (err as Error).message
        });
      }
    }
    return results;
  }

  /**
   * Fetches recent scrape jobs for polling / toast updates
   */
  public async getRecentJobs(limit = 20) {
    return prisma.scrapeJob.findMany({
      take: clampLimit(limit, 20, 100),
      orderBy: { startedAt: 'desc' },
      include: {
        source: { select: { code: true, name: true } }
      }
    });
  }
}

export const sourceService = new SourceService();

export function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}
