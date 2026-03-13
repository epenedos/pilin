import api from './client';
import { Budget } from '../types';

export const budgetsApi = {
  async list(month: string): Promise<Budget[]> {
    const { data } = await api.get('/budgets', { params: { month } });
    return data;
  },

  async create(body: { categoryId: string; month: string; amount: number }): Promise<Budget> {
    const { data } = await api.post('/budgets', body);
    return data;
  },

  async update(id: string, amount: number): Promise<Budget> {
    const { data } = await api.put(`/budgets/${id}`, { amount });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },

  async copy(fromMonth: string, toMonth: string): Promise<Budget[]> {
    const { data } = await api.post('/budgets/copy', { fromMonth, toMonth });
    return data;
  },
};
