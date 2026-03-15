import { Request, Response } from 'express';
import { accountRepo } from '../repositories/account.repository';
import { categoryRepo } from '../repositories/category.repository';
import { entryRepo } from '../repositories/entry.repository';
import { NotFoundError } from '../utils/errors';

const IPHONE_CATEGORY_NAME = 'iPhone Expense';
const IPHONE_CATEGORY_COLOR = '#FF9500';

export const externalController = {
  async createExpense(req: Request, res: Response) {
    const { account, date, amount, businessName, userId } = req.body;

    const userAccount = await accountRepo.findByName(account, userId);
    if (!userAccount) throw new NotFoundError('Account not found');

    let category = await categoryRepo.findByName(IPHONE_CATEGORY_NAME, userId);
    if (!category) {
      category = await categoryRepo.create(userId, IPHONE_CATEGORY_NAME, IPHONE_CATEGORY_COLOR, null, false);
    }

    const entry = await entryRepo.create({
      userId,
      categoryId: category.id,
      accountId: userAccount.id,
      type: 'expense',
      amount,
      currency: userAccount.currency || 'USD',
      description: businessName,
      entryDate: date,
      isRecurring: false,
    });

    res.status(201).json({
      id: entry.id,
      type: entry.type,
      accountId: entry.account_id,
      categoryId: entry.category_id,
      amount: parseFloat(entry.amount),
      currency: entry.currency,
      description: entry.description,
      entryDate: entry.entry_date instanceof Date ? entry.entry_date.toISOString().split('T')[0] : String(entry.entry_date).split('T')[0],
    });
  },
};
