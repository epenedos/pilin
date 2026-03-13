import api from './client';
import { User } from '../types';

export const authApi = {
  async register(email: string, password: string, displayName: string): Promise<{ accessToken: string; user: User }> {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    return data;
  },

  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await api.post('/auth/refresh');
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
