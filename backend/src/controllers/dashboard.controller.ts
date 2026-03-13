import { Response } from 'express';
import { AuthRequest } from '../types';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async summary(req: AuthRequest, res: Response) {
    const month = (req.query.month as string) || new Date().toISOString().split('T')[0];
    const data = await dashboardService.getSummary(req.userId!, month);
    res.json(data);
  },
};
