import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive(),
});

export const copyBudgetSchema = z.object({
  fromMonth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toMonth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
