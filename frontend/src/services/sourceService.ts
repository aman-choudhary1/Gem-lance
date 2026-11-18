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

export interface FullFetchResult extends PipelineSummaryResult {
  pagesRead: number;
  totalPages: number | null;
  rows: number;
  incomplete: boolean;
}

/** The portal wants a person to type a code (at the start, after a wrong code, or every few pages). */
export interface FullFetchCodeStep {
  status: 'needs_code';
  sessionId: string;
  code: string;
  expiresAt: string;
  reason: 'start' | 'rejected' | 'rechallenge';
  pagesRead: number;
  totalPages: number | null;
  rows: number;
}

export type FullFetchStepResult = FullFetchCodeStep | (FullFetchResult & { status: 'SUCCESS' | 'PARTIAL' | 'FAILED' });

export interface FullFetchProgress {
  running: boolean;
  pagesRead: number;
  totalPages: number | null;
  rows: number;
  startedAt: string;
}

export const sourceService = {
  /** Chhattisgarh full fetch, step 1: the portal's authentication code for a new session. */
  async startCgFullFetch(): Promise<FullFetchCodeStep> {
    const res = await api.post('/sources/cgstate/full-fetch/start');
    return res.data.data;
  },

  /** Step 2 (repeatable): submit the code the admin typed. Returns the next code to type, or the import result. */
  async submitCgFullFetchCode(sessionId: string, code: string): Promise<FullFetchStepResult> {
    const res = await api.post('/sources/cgstate/full-fetch/submit', { sessionId, code });
    return res.data.data;
  },

  async getCgFullFetchProgress(): Promise<FullFetchProgress | null> {
    const res = await api.get('/sources/cgstate/full-fetch/progress');
    return res.data.data;
  },

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
