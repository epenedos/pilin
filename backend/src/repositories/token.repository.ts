import { pool } from '../config/database';

export const tokenRepo = {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  },

  async findByHash(tokenHash: string) {
    const { rows } = await pool.query(
      `SELECT id, user_id, token_hash, expires_at, revoked
       FROM refresh_tokens
       WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async revoke(tokenHash: string) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
      [tokenHash]
    );
  },

  async revokeAllForUser(userId: string) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );
  },
};
