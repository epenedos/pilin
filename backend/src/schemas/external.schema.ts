import { z } from 'zod';

export const createExternalExpenseSchema = z.object({
  account: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  businessName: z.string().min(1).max(500),
  userId: z.string().uuid(),
});
