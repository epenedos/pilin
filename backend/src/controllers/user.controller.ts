import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import { userRepo } from '../repositories/user.repository';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

export const userController = {
  async getProfile(req: AuthRequest, res: Response) {
    const user = await userRepo.findById(req.userId!);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      defaultCurrency: user.default_currency,
      createdAt: user.created_at,
    });
  },

  async changePassword(req: AuthRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;

    const user = await userRepo.findByIdWithPassword(req.userId!);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(req.userId!, newPasswordHash);

    res.json({ message: 'Password updated successfully' });
  },

  async updateCurrency(req: AuthRequest, res: Response) {
    const { currency } = req.body;

    const user = await userRepo.updateDefaultCurrency(req.userId!, currency);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      defaultCurrency: user.default_currency,
      createdAt: user.created_at,
    });
  },
};
