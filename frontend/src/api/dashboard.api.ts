import api from './client';
import { DashboardSummary } from '../types';

export const dashboardApi = {
  async summary(month?: string): Promise<DashboardSummary> {
    const { data } = await api.get('/dashboard/summary', { params: month ? { month } : {} });
    return data;
  },
};
