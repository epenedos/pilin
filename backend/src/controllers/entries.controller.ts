import { Response } from 'express';
import { AuthRequest } from '../types';
import { entryRepo } from '../repositories/entry.repository';
import { entriesService } from '../services/entries.service';
import { NotFoundError } from '../utils/errors';

export const entriesController = {
  async list(req: AuthRequest, res: Response) {
    const { type, from, to, categoryId, page = '1', limit = '50' } = req.query;
    const result = await entriesService.getEntries(req.userId!, {
      type: type as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      categoryId: categoryId as string | undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    });

    res.json({
      data: result.data.map((e: any) => ({
        id: e.id,
        type: e.type,
        categoryId: e.category_id,
        categoryName: e.category_name,
        categoryColor: e.category_color,
        amount: parseFloat(e.amount),
        description: e.description,
        entryDate: e.entry_date,
        isRecurring: e.is_recurring,
        parentRecurringId: e.parent_recurring_id,
        createdAt: e.created_at,
      })),
      total: result.total,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
  },

  async create(req: AuthRequest, res: Response) {
    const { type, categoryId, amount, description, entryDate, isRecurring, recurrence, recurrenceStart, recurrenceEnd } = req.body;
    const entry = await entryRepo.create({
      userId: req.userId!,
      categoryId,
      type,
      amount,
      description,
      entryDate,
      isRecurring,
      recurrence: isRecurring ? recurrence : null,
      recurrenceStart: isRecurring ? (recurrenceStart || entryDate) : null,
      recurrenceEnd: isRecurring ? recurrenceEnd : null,
    });

    res.status(201).json({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      amount: parseFloat(entry.amount),
      description: entry.description,
      entryDate: entry.entry_date,
      isRecurring: entry.is_recurring,
      recurrence: entry.recurrence,
    });
  },

  async update(req: AuthRequest, res: Response) {
    const entry = await entryRepo.update(req.params.id, req.userId!, req.body);
    if (!entry) throw new NotFoundError('Entry not found');
    res.json({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      amount: parseFloat(entry.amount),
      description: entry.description,
      entryDate: entry.entry_date,
    });
  },

  async delete(req: AuthRequest, res: Response) {
    const deleted = await entryRepo.delete(req.params.id, req.userId!);
    if (!deleted) throw new NotFoundError('Entry not found');
    res.status(204).send();
  },

  async listRecurring(req: AuthRequest, res: Response) {
    const entries = await entryRepo.findRecurringDefinitions(req.userId!);
    res.json(entries.map((e: any) => ({
      id: e.id,
      type: e.type,
      categoryId: e.category_id,
      categoryName: e.category_name,
      categoryColor: e.category_color,
      amount: parseFloat(e.amount),
      description: e.description,
      recurrence: e.recurrence,
      recurrenceStart: e.recurrence_start,
      recurrenceEnd: e.recurrence_end,
    })));
  },

  async updateRecurring(req: AuthRequest, res: Response) {
    const entry = await entryRepo.updateRecurring(req.params.id, req.userId!, req.body);
    if (!entry) throw new NotFoundError('Recurring entry not found');
    res.json({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      amount: parseFloat(entry.amount),
      description: entry.description,
      recurrence: entry.recurrence,
      recurrenceStart: entry.recurrence_start,
      recurrenceEnd: entry.recurrence_end,
    });
  },

  async deleteRecurring(req: AuthRequest, res: Response) {
    const deleteGenerated = req.query.deleteGenerated === 'true';
    const deleted = await entryRepo.deleteRecurring(req.params.id, req.userId!, deleteGenerated);
    if (!deleted) throw new NotFoundError('Recurring entry not found');
    res.status(204).send();
  },
};
