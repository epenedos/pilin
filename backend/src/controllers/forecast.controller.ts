import { Response } from 'express';
import { AuthRequest } from '../types';
import { forecastService } from '../services/forecast.service';

export const forecastController = {
  async forecast(req: AuthRequest, res: Response) {
    const months = parseInt((req.query.months as string) || '6', 10);
    const clamped = Math.min(Math.max(months, 1), 24);
    const data = await forecastService.getForecast(req.userId!, clamped);
    res.json(data);
  },
};
