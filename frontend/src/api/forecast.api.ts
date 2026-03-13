import api from './client';
import { ForecastData } from '../types';

export const forecastApi = {
  async get(months = 6): Promise<ForecastData> {
    const { data } = await api.get('/forecast', { params: { months } });
    return data;
  },
};
