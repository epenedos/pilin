import api from './client';
import { MoneyEntry, RecurringEntry } from '../types';

export const entriesApi = {
  async list(params: {
    type?: string;
    from?: string;
    to?: string;
    categoryId?: string;
    accountId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: MoneyEntry[]; total: number; page: number; limit: number }> {
    const { data } = await api.get('/entries', { params });
    return data;
  },

  async create(body: {
    type: string;
    categoryId?: string | null;
    accountId: string;
    toAccountId?: string | null;
    amount: number;
    description: string;
    entryDate: string;
    isRecurring?: boolean;
    recurrence?: string;
    recurrenceStart?: string;
    recurrenceEnd?: string | null;
  }): Promise<MoneyEntry> {
    const { data } = await api.post('/entries', body);
    return data;
  },

  async update(id: string, body: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    description?: string;
    entryDate?: string;
  }): Promise<MoneyEntry> {
    const { data } = await api.put(`/entries/${id}`, body);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/entries/${id}`);
  },

  async listRecurring(): Promise<RecurringEntry[]> {
    const { data } = await api.get('/entries/recurring');
    return data;
  },

  async updateRecurring(id: string, body: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    description?: string;
    recurrence?: string;
    recurrenceEnd?: string | null;
  }): Promise<RecurringEntry> {
    const { data } = await api.put(`/entries/recurring/${id}`, body);
    return data;
  },

  async deleteRecurring(id: string, deleteGenerated = false): Promise<void> {
    await api.delete(`/entries/recurring/${id}`, { params: { deleteGenerated } });
  },
};
