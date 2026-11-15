import { api } from './api';
import { SavedAuction } from '../types';

export const savedService = {
  async getSavedAuctions(): Promise<SavedAuction[]> {
    const res = await api.get('/saved-auctions');
    return res.data.data;
  },

  async saveAuction(auctionId: string, notes?: string): Promise<SavedAuction> {
    const res = await api.post(`/saved-auctions/${auctionId}`, { notes });
    return res.data.data;
  },

  async removeSavedAuction(auctionId: string): Promise<void> {
    await api.delete(`/saved-auctions/${auctionId}`);
  }
};
