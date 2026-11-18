import { api } from './api';
import { Category } from '../types';

export type InterestCategory = Pick<Category, 'id' | 'name' | 'slug'>;

export const interestService = {
  async getInterests(): Promise<InterestCategory[]> {
    const res = await api.get('/interests');
    return res.data.data;
  },

  async setInterests(categoryIds: string[]): Promise<InterestCategory[]> {
    const res = await api.put('/interests', { categoryIds });
    return res.data.data;
  }
};
