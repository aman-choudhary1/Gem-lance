import { api } from './api';
import { AuctionSource, Category } from '../types';

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
    startedAt: string;
    completedAt: string | null;
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
    lastIngestionAt: string | null;
  };
  sites: SiteAnalyticsItem[];
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { name: string; count: number }[];
  stateBreakdown: { state: string; count: number }[];
  recentJobs: Array<{
    id: string;
    sourceId: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsFailed: number;
    errorMessage: string | null;
    source?: { code: string; name: string };
  }>;
}

export interface PipelineSummaryResult {
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

export const sourceService = {
  async getAllSources(): Promise<AuctionSource[]> {
    const res = await api.get('/sources');
    return res.data.data;
  },

  async getSourceByCode(code: string): Promise<AuctionSource> {
    const res = await api.get(`/sources/${code}`);
    return res.data.data;
  },

  async getAnalyticsReport(): Promise<AnalyticsReportData> {
    const res = await api.get('/sources/analytics/report');
    return res.data.data;
  },

  async triggerSync(code: string): Promise<PipelineSummaryResult> {
    const res = await api.post(`/sources/${code}/sync`);
    return res.data.data;
  },

  async triggerBatchSync(codes?: string[]): Promise<PipelineSummaryResult[]> {
    const res = await api.post('/sources/batch-sync', { codes });
    return res.data.data;
  },

  async getRecentJobs(limit = 20) {
    const res = await api.get('/sources/scraper/recent-jobs', { params: { limit } });
    return res.data.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await api.get('/categories');
    return res.data.data;
  },

  async getStates(): Promise<Array<{ name: string; count: number }>> {
    const res = await api.get('/locations/states');
    return res.data.data;
  },

  async getDistricts(state?: string): Promise<Array<{ state: string; district: string; city: string }>> {
    const res = await api.get('/locations/districts', { params: { state } });
    return res.data.data;
  }
};
