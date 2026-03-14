import { pool } from '../config/database';
import { User, UserWithPassword } from '../types';

export const userRepo = {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, display_name, default_currency, created_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, default_currency, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByIdWithPassword(id: string): Promise<UserWithPassword | null> {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, display_name, default_currency, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create(email: string, passwordHash: string, displayName: string): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, default_currency, created_at`,
      [email, passwordHash, displayName]
    );
    return rows[0];
  },

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );
  },

  async updateDefaultCurrency(userId: string, currency: string): Promise<User | null> {
    const { rows } = await pool.query(
      `UPDATE users SET default_currency = $1 WHERE id = $2
       RETURNING id, email, display_name, default_currency, created_at`,
      [currency, userId]
    );
    return rows[0] || null;
  },
};
