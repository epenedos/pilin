import { Response } from 'express';
import { AuthRequest } from '../types';
import { accountRepo } from '../repositories/account.repository';
import { NotFoundError } from '../utils/errors';

export const accountsController = {
  async list(req: AuthRequest, res: Response) {
    const accounts = await accountRepo.findAllByUser(req.userId!);
    res.json(accounts.map((a: any) => ({
      id: a.id,
      name: a.name,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })));
  },

  async balances(req: AuthRequest, res: Response) {
    const accounts = await accountRepo.getBalances(req.userId!);
    res.json(accounts.map((a: any) => ({
      id: a.id,
      name: a.name,
      balance: parseFloat(a.balance),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })));
  },

  async create(req: AuthRequest, res: Response) {
    const account = await accountRepo.create(req.userId!, req.body.name);
    res.status(201).json({
      id: account.id,
      name: account.name,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    });
  },

  async update(req: AuthRequest, res: Response) {
    const account = await accountRepo.update(req.params.id, req.userId!, req.body.name);
    if (!account) throw new NotFoundError('Account not found');
    res.json({
      id: account.id,
      name: account.name,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    });
  },

  async delete(req: AuthRequest, res: Response) {
    const deleted = await accountRepo.delete(req.params.id, req.userId!);
    if (!deleted) throw new NotFoundError('Account not found');
    res.status(204).send();
  },
};
