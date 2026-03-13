import api from './client';
import { SankeyData } from '../types';

export const chartsApi = {
  async monthlySankey(month: string): Promise<SankeyData> {
    const { data } = await api.get('/charts/sankey/monthly', { params: { month } });
    return data;
  },

  async annualSankey(year: number): Promise<SankeyData> {
    const { data } = await api.get('/charts/sankey/annual', { params: { year } });
    return data;
  },
};
