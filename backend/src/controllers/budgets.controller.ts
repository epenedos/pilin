import { Response } from 'express';
import { AuthRequest } from '../types';
import { budgetRepo } from '../repositories/budget.repository';
import { NotFoundError } from '../utils/errors';

export const budgetsController = {
  async list(req: AuthRequest, res: Response) {
    const month = req.query.month as string;
    const budgets = await budgetRepo.findByMonth(req.userId!, month);
    res.json(budgets.map((b: any) => ({
      id: b.id,
      categoryId: b.category_id,
      categoryName: b.category_name,
      categoryColor: b.category_color,
      month: b.month,
      amount: parseFloat(b.amount),
      spent: parseFloat(b.spent),
    })));
  },

  async create(req: AuthRequest, res: Response) {
    const { categoryId, month, amount } = req.body;
    const budget = await budgetRepo.create(req.userId!, categoryId, month, amount);
    res.status(201).json({
      id: budget.id,
      categoryId: budget.category_id,
      month: budget.month,
      amount: parseFloat(budget.amount),
    });
  },

  async update(req: AuthRequest, res: Response) {
    const budget = await budgetRepo.update(req.params.id, req.userId!, req.body.amount);
    if (!budget) throw new NotFoundError('Budget not found');
    res.json({
      id: budget.id,
      categoryId: budget.category_id,
      month: budget.month,
      amount: parseFloat(budget.amount),
    });
  },

  async delete(req: AuthRequest, res: Response) {
    const deleted = await budgetRepo.delete(req.params.id, req.userId!);
    if (!deleted) throw new NotFoundError('Budget not found');
    res.status(204).send();
  },

  async copy(req: AuthRequest, res: Response) {
    const { fromMonth, toMonth } = req.body;
    const budgets = await budgetRepo.copyBudgets(req.userId!, fromMonth, toMonth);
    res.json(budgets.map((b: any) => ({
      id: b.id,
      categoryId: b.category_id,
      month: b.month,
      amount: parseFloat(b.amount),
    })));
  },
};
