import { z } from 'zod';

export const createEntrySchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  categoryId: z.string().uuid().nullable().optional(),
  accountId: z.string().uuid(),
  toAccountId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']).nullable().optional(),
  recurrenceStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  recurrenceEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine((data) => {
  if (data.type === 'transfer') {
    return !!data.toAccountId && !data.categoryId && !data.isRecurring;
  }
  return !!data.categoryId && !data.toAccountId;
}, {
  message: 'Transfers require toAccountId and no category. Non-transfers require categoryId and no toAccountId.',
});

export const updateEntrySchema = z.object({
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateRecurringSchema = z.object({
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  recurrence: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']).optional(),
  recurrenceEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
