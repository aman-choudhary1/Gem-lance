import { api } from './api';
import { User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<{ user: User; accessToken: string }> {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; accessToken: string }> {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auctionlens_access_token');
    localStorage.removeItem('auctionlens_user');
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data;
  }
};
