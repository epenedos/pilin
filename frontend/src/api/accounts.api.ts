import api from './client';
import { Account, AccountWithBalance } from '../types';

export const accountsApi = {
  async list(): Promise<Account[]> {
    const { data } = await api.get('/accounts');
    return data;
  },

  async balances(): Promise<AccountWithBalance[]> {
    const { data } = await api.get('/accounts/balances');
    return data;
  },

  async create(body: { name: string; currency?: string; initialBalance?: number }): Promise<Account> {
    const { data } = await api.post('/accounts', body);
    return data;
  },

  async update(id: string, body: { name?: string; initialBalance?: number }): Promise<Account> {
    const { data } = await api.put(`/accounts/${id}`, body);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
};
