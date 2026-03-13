import api from './client';
import { Category } from '../types';

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await api.get('/categories');
    return data;
  },

  async create(body: { name: string; color: string; icon?: string; isIncome: boolean }): Promise<Category> {
    const { data } = await api.post('/categories', body);
    return data;
  },

  async update(id: string, body: { name?: string; color?: string; icon?: string; sortOrder?: number }): Promise<Category> {
    const { data } = await api.put(`/categories/${id}`, body);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
