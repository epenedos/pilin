import { Response } from 'express';
import { AuthRequest } from '../types';
import { entryRepo } from '../repositories/entry.repository';
import { accountRepo } from '../repositories/account.repository';
import { entriesService } from '../services/entries.service';
import { xeService } from '../services/xe.service';
import { NotFoundError } from '../utils/errors';

export const entriesController = {
  async list(req: AuthRequest, res: Response) {
    const { type, from, to, categoryId, accountId, page = '1', limit = '50' } = req.query;
    const result = await entriesService.getEntries(req.userId!, {
      type: type as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      categoryId: categoryId as string | undefined,
      accountId: accountId as string | undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    });

    res.json({
      data: result.data.map((e: any) => ({
        id: e.id,
        type: e.type,
        categoryId: e.category_id,
        categoryName: e.category_name || null,
        categoryColor: e.category_color || null,
        accountId: e.account_id,
        accountName: e.account_name,
        toAccountId: e.to_account_id || null,
        toAccountName: e.to_account_name || null,
        amount: parseFloat(e.amount),
        currency: e.currency,
        convertedAmount: e.converted_amount ? parseFloat(e.converted_amount) : null,
        exchangeRate: e.exchange_rate ? parseFloat(e.exchange_rate) : null,
        description: e.description,
        entryDate: e.entry_date instanceof Date ? e.entry_date.toISOString().split('T')[0] : String(e.entry_date).split('T')[0],
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
    const { type, categoryId, accountId, toAccountId, amount, currency, description, entryDate, isRecurring, recurrence, recurrenceStart, recurrenceEnd } = req.body;

    // Validate accounts belong to current user
    const account = await accountRepo.findById(accountId, req.userId!);
    if (!account) throw new NotFoundError('Account not found');

    if (type === 'transfer') {
      const toAccount = await accountRepo.findById(toAccountId, req.userId!);
      if (!toAccount) throw new NotFoundError('Destination account not found');
    }

    // Use provided currency or default to account's currency
    const entryCurrency = currency || account.currency || 'USD';

    // Calculate conversion if entry currency differs from account currency
    let convertedAmount: number | null = null;
    let exchangeRate: number | null = null;

    if (entryCurrency.toUpperCase() !== (account.currency || 'USD').toUpperCase()) {
      const conversion = await xeService.convertAmount(amount, entryCurrency, account.currency || 'USD');
      convertedAmount = conversion.convertedAmount;
      exchangeRate = conversion.exchangeRate;
    }

    const entry = await entryRepo.create({
      userId: req.userId!,
      categoryId: categoryId || null,
      accountId,
      toAccountId: toAccountId || null,
      type,
      amount,
      currency: entryCurrency.toUpperCase(),
      convertedAmount,
      exchangeRate,
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
      accountId: entry.account_id,
      toAccountId: entry.to_account_id,
      amount: parseFloat(entry.amount),
      currency: entry.currency,
      convertedAmount: entry.converted_amount ? parseFloat(entry.converted_amount) : null,
      exchangeRate: entry.exchange_rate ? parseFloat(entry.exchange_rate) : null,
      description: entry.description,
      entryDate: entry.entry_date instanceof Date ? entry.entry_date.toISOString().split('T')[0] : String(entry.entry_date).split('T')[0],
      isRecurring: entry.is_recurring,
      recurrence: entry.recurrence,
    });
  },

  async update(req: AuthRequest, res: Response) {
    const { accountId, amount, currency, ...otherData } = req.body;

    // If amount or currency is being updated, we may need to recalculate conversion
    let updateData: any = { ...otherData };

    if (amount !== undefined || currency !== undefined || accountId !== undefined) {
      // Get the existing entry to determine current values
      const existingEntry = await entryRepo.findById(req.params.id, req.userId!);
      if (!existingEntry) throw new NotFoundError('Entry not found');

      // Get the target account (either new accountId or existing)
      const targetAccountId = accountId || existingEntry.account_id;
      const account = await accountRepo.findById(targetAccountId, req.userId!);
      if (!account) throw new NotFoundError('Account not found');

      // Determine the currency to use
      const entryCurrency = currency || existingEntry.currency || account.currency || 'USD';
      const entryAmount = amount !== undefined ? amount : parseFloat(existingEntry.amount);

      updateData.accountId = accountId;
      updateData.amount = amount;
      updateData.currency = entryCurrency.toUpperCase();

      // Calculate conversion if currencies differ
      if (entryCurrency.toUpperCase() !== (account.currency || 'USD').toUpperCase()) {
        const conversion = await xeService.convertAmount(entryAmount, entryCurrency, account.currency || 'USD');
        updateData.convertedAmount = conversion.convertedAmount;
        updateData.exchangeRate = conversion.exchangeRate;
      } else {
        updateData.convertedAmount = null;
        updateData.exchangeRate = null;
      }
    }

    const entry = await entryRepo.update(req.params.id, req.userId!, updateData);
    if (!entry) throw new NotFoundError('Entry not found');
    res.json({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      accountId: entry.account_id,
      toAccountId: entry.to_account_id,
      amount: parseFloat(entry.amount),
      currency: entry.currency,
      convertedAmount: entry.converted_amount ? parseFloat(entry.converted_amount) : null,
      exchangeRate: entry.exchange_rate ? parseFloat(entry.exchange_rate) : null,
      description: entry.description,
      entryDate: entry.entry_date instanceof Date ? entry.entry_date.toISOString().split('T')[0] : String(entry.entry_date).split('T')[0],
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
      categoryName: e.category_name || null,
      categoryColor: e.category_color || null,
      accountId: e.account_id,
      accountName: e.account_name,
      amount: parseFloat(e.amount),
      currency: e.currency,
      convertedAmount: e.converted_amount ? parseFloat(e.converted_amount) : null,
      exchangeRate: e.exchange_rate ? parseFloat(e.exchange_rate) : null,
      description: e.description,
      recurrence: e.recurrence,
      recurrenceStart: e.recurrence_start,
      recurrenceEnd: e.recurrence_end,
    })));
  },

  async updateRecurring(req: AuthRequest, res: Response) {
    const { accountId, amount, currency, ...otherData } = req.body;

    let updateData: any = { ...otherData };

    if (amount !== undefined || currency !== undefined || accountId !== undefined) {
      // Get existing entry
      const existingEntry = await entryRepo.findById(req.params.id, req.userId!);
      if (!existingEntry) throw new NotFoundError('Recurring entry not found');

      // Get the target account
      const targetAccountId = accountId || existingEntry.account_id;
      const account = await accountRepo.findById(targetAccountId, req.userId!);
      if (!account) throw new NotFoundError('Account not found');

      const entryCurrency = currency || existingEntry.currency || account.currency || 'USD';
      const entryAmount = amount !== undefined ? amount : parseFloat(existingEntry.amount);

      updateData.accountId = accountId;
      updateData.amount = amount;
      updateData.currency = entryCurrency.toUpperCase();

      if (entryCurrency.toUpperCase() !== (account.currency || 'USD').toUpperCase()) {
        const conversion = await xeService.convertAmount(entryAmount, entryCurrency, account.currency || 'USD');
        updateData.convertedAmount = conversion.convertedAmount;
        updateData.exchangeRate = conversion.exchangeRate;
      } else {
        updateData.convertedAmount = null;
        updateData.exchangeRate = null;
      }
    }

    const entry = await entryRepo.updateRecurring(req.params.id, req.userId!, updateData);
    if (!entry) throw new NotFoundError('Recurring entry not found');
    res.json({
      id: entry.id,
      type: entry.type,
      categoryId: entry.category_id,
      accountId: entry.account_id,
      amount: parseFloat(entry.amount),
      currency: entry.currency,
      convertedAmount: entry.converted_amount ? parseFloat(entry.converted_amount) : null,
      exchangeRate: entry.exchange_rate ? parseFloat(entry.exchange_rate) : null,
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
