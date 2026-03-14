import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().length(3, 'Currency must be a 3-letter code').toUpperCase().default('USD'),
  initialBalance: z.number().min(0).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  initialBalance: z.number().min(0).optional(),
});
