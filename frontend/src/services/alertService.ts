import { api } from './api';
import { AuctionAlert, Notification } from '../types';

export const alertService = {
  async getAlerts(): Promise<AuctionAlert[]> {
    const res = await api.get('/alerts');
    return res.data.data;
  },

  async createAlert(data: Partial<AuctionAlert>): Promise<AuctionAlert> {
    const res = await api.post('/alerts', data);
    return res.data.data;
  },

  async updateAlert(id: string, data: Partial<AuctionAlert>): Promise<AuctionAlert> {
    const res = await api.patch(`/alerts/${id}`, data);
    return res.data.data;
  },

  async deleteAlert(id: string): Promise<void> {
    await api.delete(`/alerts/${id}`);
  },

  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await api.get('/notifications');
    return {
      notifications: res.data.data,
      unreadCount: res.data.unreadCount
    };
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  }
};
