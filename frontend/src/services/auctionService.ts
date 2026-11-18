import { api } from './api';
import { Auction, PaginatedResponse, DashboardStats } from '../types';

export type ForYouAuction = Auction & { reason: { type: 'alert' | 'interest' | 'saved'; label: string } };

export interface AuctionSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
  category?: string;
  state?: string;
  district?: string;
  city?: string;
  organization?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

export const auctionService = {
  async getAuctions(params?: AuctionSearchParams): Promise<PaginatedResponse<Auction>> {
    const res = await api.get('/auctions', { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination
    };
  },

  async getAuctionById(id: string): Promise<Auction> {
    const res = await api.get(`/auctions/${encodeURIComponent(id)}`);
    return res.data.data;
  },

  async getEndingSoon(hours = 24, limit = 20, source?: string, category?: string): Promise<Auction[]> {
    const res = await api.get('/auctions/ending-soon', {
      params: { hours, limit, source, category }
    });
    return res.data.data;
  },

  async getForYou(limit = 12): Promise<{ data: ForYouAuction[]; hasAlerts: boolean; hasInterests: boolean; hasSaved: boolean }> {
    const res = await api.get('/auctions/for-you', { params: { limit } });
    return { data: res.data.data, hasAlerts: res.data.hasAlerts, hasInterests: res.data.hasInterests, hasSaved: res.data.hasSaved };
  },

  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/auctions/stats');
    return res.data.data;
  }
};
