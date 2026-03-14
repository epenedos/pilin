import { Response } from 'express';
import { AuthRequest } from '../types';
import { accountRepo } from '../repositories/account.repository';
import { categoryRepo } from '../repositories/category.repository';
import { entryRepo } from '../repositories/entry.repository';
import { NotFoundError } from '../utils/errors';

async function findOrCreateOtherIncomeCategory(userId: string) {
  const categories = await categoryRepo.findAllByUser(userId);
  const otherCategory = categories.find(
    (c: any) => c.name.toLowerCase() === 'other' && c.is_income === true
  );
  if (otherCategory) {
    return otherCategory;
  }
  return categoryRepo.create(userId, 'Other', '#9CA3AF', null, true);
}

async function createInitialBalanceEntry(
  userId: string,
  accountId: string,
  amount: number,
  currency: string,
  categoryId: string
) {
  const entry = await entryRepo.create({
    userId,
    categoryId,
    accountId,
    type: 'income',
    amount,
    currency,
    description: 'Initial Balance',
    entryDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
  });
  return entry;
}

export const accountsController = {
  async list(req: AuthRequest, res: Response) {
    const accounts = await accountRepo.findAllByUser(req.userId!);
    res.json(accounts.map((a: any) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      initialBalanceEntryId: a.initialBalanceEntryId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })));
  },

  async balances(req: AuthRequest, res: Response) {
    const accounts = await accountRepo.getBalances(req.userId!);
    res.json(accounts.map((a: any) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      initialBalanceEntryId: a.initial_balance_entry_id,
      balance: parseFloat(a.balance),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })));
  },

  async create(req: AuthRequest, res: Response) {
    const { name, currency, initialBalance } = req.body;
    const account = await accountRepo.create(req.userId!, name, currency);

    if (initialBalance !== undefined && initialBalance > 0) {
      const category = await findOrCreateOtherIncomeCategory(req.userId!);
      const entry = await createInitialBalanceEntry(
        req.userId!,
        account.id,
        initialBalance,
        account.currency,
        category.id
      );
      await accountRepo.setInitialBalanceEntry(account.id, req.userId!, entry.id);
      account.initialBalanceEntryId = entry.id;
    }

    res.status(201).json({
      id: account.id,
      name: account.name,
      currency: account.currency,
      initialBalanceEntryId: account.initialBalanceEntryId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  },

  async update(req: AuthRequest, res: Response) {
    const { name, initialBalance } = req.body;
    const existingAccount = await accountRepo.findById(req.params.id, req.userId!);
    if (!existingAccount) throw new NotFoundError('Account not found');

    const account = await accountRepo.update(req.params.id, req.userId!, { name });
    if (!account) throw new NotFoundError('Account not found');

    if (initialBalance !== undefined) {
      const existingEntryId = existingAccount.initialBalanceEntryId;

      if (initialBalance === 0 || initialBalance === null) {
        // Remove initial balance entry if it exists
        if (existingEntryId) {
          await entryRepo.delete(existingEntryId, req.userId!);
          await accountRepo.setInitialBalanceEntry(account.id, req.userId!, null);
          account.initialBalanceEntryId = null;
        }
      } else if (existingEntryId) {
        // Update existing entry
        await entryRepo.update(existingEntryId, req.userId!, {
          amount: initialBalance,
        });
      } else {
        // Create new initial balance entry
        const category = await findOrCreateOtherIncomeCategory(req.userId!);
        const entry = await createInitialBalanceEntry(
          req.userId!,
          account.id,
          initialBalance,
          account.currency,
          category.id
        );
        await accountRepo.setInitialBalanceEntry(account.id, req.userId!, entry.id);
        account.initialBalanceEntryId = entry.id;
      }
    }

    res.json({
      id: account.id,
      name: account.name,
      currency: account.currency,
      initialBalanceEntryId: account.initialBalanceEntryId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  },

  async delete(req: AuthRequest, res: Response) {
    const deleted = await accountRepo.delete(req.params.id, req.userId!);
    if (!deleted) throw new NotFoundError('Account not found');
    res.status(204).send();
  },
};
