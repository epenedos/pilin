import { Response } from 'express';
import { AuthRequest } from '../types';
import { sankeyService } from '../services/sankey.service';

export const chartsController = {
  async monthlySankey(req: AuthRequest, res: Response) {
    const month = req.query.month as string;
    const data = await sankeyService.getMonthlySankey(req.userId!, month);
    res.json(data);
  },

  async annualSankey(req: AuthRequest, res: Response) {
    const year = parseInt(req.query.year as string, 10);
    const data = await sankeyService.getAnnualSankey(req.userId!, year);
    res.json(data);
  },
};
