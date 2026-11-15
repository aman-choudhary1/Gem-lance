import { api } from './api';
import { ScrapeJob, AuctionSource } from '../types';

export interface AdminDashboardData {
  metrics: {
    totalSources: number;
    totalAuctions: number;
    liveAuctions: number;
    totalUsers: number;
    totalAlerts: number;
  };
  sources: AuctionSource[];
  recentJobs: ScrapeJob[];
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboardData> {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  async getScraperStatus(): Promise<{ providers: any[]; recentJobs: ScrapeJob[] }> {
    const res = await api.get('/admin/scraper/status');
    return res.data.data;
  },

  async getScrapeJobs(limit = 50): Promise<ScrapeJob[]> {
    const res = await api.get('/admin/scraper/jobs', { params: { limit } });
    return res.data.data;
  },

  async triggerScrape(sourceCode: string): Promise<any> {
    const res = await api.post(`/admin/scraper/run/${sourceCode}`);
    return res.data.data;
  },

  async toggleSource(sourceId: string, enabled: boolean): Promise<AuctionSource> {
    const res = await api.patch(`/admin/sources/${sourceId}/toggle`, { enabled });
    return res.data.data;
  }
};
