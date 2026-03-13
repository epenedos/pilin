import { Response } from 'express';
import { AuthRequest } from '../types';
import { categoryRepo } from '../repositories/category.repository';
import { NotFoundError } from '../utils/errors';

export const categoriesController = {
  async list(req: AuthRequest, res: Response) {
    const categories = await categoryRepo.findAllByUser(req.userId!);
    res.json(categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      isIncome: c.is_income,
      sortOrder: c.sort_order,
    })));
  },

  async create(req: AuthRequest, res: Response) {
    const { name, color, icon, isIncome } = req.body;
    const cat = await categoryRepo.create(req.userId!, name, color, icon || null, isIncome);
    res.status(201).json({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      isIncome: cat.is_income,
      sortOrder: cat.sort_order,
    });
  },

  async update(req: AuthRequest, res: Response) {
    const cat = await categoryRepo.update(req.params.id, req.userId!, req.body);
    if (!cat) throw new NotFoundError('Category not found');
    res.json({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      isIncome: cat.is_income,
      sortOrder: cat.sort_order,
    });
  },

  async delete(req: AuthRequest, res: Response) {
    const deleted = await categoryRepo.delete(req.params.id, req.userId!);
    if (!deleted) throw new NotFoundError('Category not found');
    res.status(204).send();
  },
};
