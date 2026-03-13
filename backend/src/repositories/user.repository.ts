import { pool } from '../config/database';

export const userRepo = {
  async findByEmail(email: string) {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id: string) {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create(email: string, passwordHash: string, displayName: string) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [email, passwordHash, displayName]
    );
    return rows[0];
  },
};
