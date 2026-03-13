import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { userRepo } from '../repositories/user.repository';
import { tokenRepo } from '../repositories/token.repository';
import { categoryRepo } from '../repositories/category.repository';
import { ConflictError, UnauthorizedError } from '../utils/errors';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', color: '#EF4444', icon: 'utensils' },
  { name: 'Transport', color: '#F59E0B', icon: 'car' },
  { name: 'Housing', color: '#8B5CF6', icon: 'home' },
  { name: 'Utilities', color: '#06B6D4', icon: 'bolt' },
  { name: 'Entertainment', color: '#EC4899', icon: 'gamepad' },
  { name: 'Health', color: '#10B981', icon: 'heart' },
  { name: 'Shopping', color: '#F97316', icon: 'cart' },
  { name: 'Other', color: '#6B7280', icon: 'ellipsis' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', color: '#22C55E', icon: 'briefcase' },
  { name: 'Freelance', color: '#3B82F6', icon: 'laptop' },
  { name: 'Investments', color: '#A855F7', icon: 'chart' },
  { name: 'Other', color: '#6B7280', icon: 'ellipsis' },
];

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, env.accessTokenSecret, {
    expiresIn: 900, // 15 minutes in seconds
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export const authService = {
  async register(email: string, password: string, displayName: string) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepo.create(email, passwordHash, displayName);

    // Seed default categories
    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      await categoryRepo.create(user.id, cat.name, cat.color, cat.icon, false);
    }
    for (const cat of DEFAULT_INCOME_CATEGORIES) {
      await categoryRepo.create(user.id, cat.name, cat.color, cat.icon, true);
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiryMs);
    await tokenRepo.create(user.id, hashToken(refreshToken), expiresAt);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    };
  },

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiryMs);
    await tokenRepo.create(user.id, hashToken(refreshToken), expiresAt);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    };
  },

  async refresh(oldRefreshToken: string) {
    const hash = hashToken(oldRefreshToken);
    const stored = await tokenRepo.findByHash(hash);
    if (!stored) throw new UnauthorizedError('Invalid refresh token');

    // Revoke old token
    await tokenRepo.revoke(hash);

    const user = await userRepo.findById(stored.user_id);
    if (!user) throw new UnauthorizedError('User not found');

    // Issue new pair
    const accessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiryMs);
    await tokenRepo.create(user.id, hashToken(newRefreshToken), expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    const hash = hashToken(refreshToken);
    const stored = await tokenRepo.findByHash(hash);
    if (stored) {
      await tokenRepo.revokeAllForUser(stored.user_id);
    }
  },
};
