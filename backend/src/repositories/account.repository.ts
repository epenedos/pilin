import { pool } from '../config/database';

export const accountRepo = {
  async findAllByUser(userId: string) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, currency, created_at, updated_at FROM accounts WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    return rows;
  },

  async findById(id: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, currency, created_at, updated_at FROM accounts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId: string, name: string, currency: string = 'USD') {
    const { rows } = await pool.query(
      `INSERT INTO accounts (user_id, name, currency) VALUES ($1, $2, $3) RETURNING *`,
      [userId, name, currency]
    );
    return rows[0];
  },

  async update(id: string, userId: string, data: { name: string; currency?: string }) {
    const { name, currency } = data;
    let query: string;
    let params: (string | undefined)[];

    if (currency !== undefined) {
      query = `UPDATE accounts SET name = $3, currency = $4, updated_at = NOW()
               WHERE id = $1 AND user_id = $2 RETURNING *`;
      params = [id, userId, name, currency];
    } else {
      query = `UPDATE accounts SET name = $3, updated_at = NOW()
               WHERE id = $1 AND user_id = $2 RETURNING *`;
      params = [id, userId, name];
    }

    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  },

  async delete(id: string, userId: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async getBalances(userId: string) {
    const { rows } = await pool.query(
      `SELECT a.id, a.name, a.currency, a.created_at, a.updated_at,
              COALESCE(SUM(
                CASE
                  WHEN me.type = 'income' AND me.account_id = a.id THEN COALESCE(me.converted_amount, me.amount)
                  WHEN me.type = 'transfer' AND me.to_account_id = a.id THEN COALESCE(me.converted_amount, me.amount)
                  WHEN me.type = 'expense' AND me.account_id = a.id THEN -COALESCE(me.converted_amount, me.amount)
                  WHEN me.type = 'transfer' AND me.account_id = a.id THEN -COALESCE(me.converted_amount, me.amount)
                  ELSE 0
                END
              ), 0) AS balance
       FROM accounts a
       LEFT JOIN money_entries me
         ON (me.account_id = a.id OR me.to_account_id = a.id)
         AND me.excluded = FALSE
         AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
       WHERE a.user_id = $1
       GROUP BY a.id, a.name, a.currency, a.created_at, a.updated_at
       ORDER BY a.created_at`,
      [userId]
    );
    return rows;
  },
};
