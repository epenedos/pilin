import { pool } from '../config/database';

function mapAccountRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    currency: row.currency,
    initialBalanceEntryId: row.initial_balance_entry_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const accountRepo = {
  async findAllByUser(userId: string) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, currency, initial_balance_entry_id, created_at, updated_at FROM accounts WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    return rows.map(mapAccountRow);
  },

  async findByName(name: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, currency, initial_balance_entry_id, created_at, updated_at FROM accounts WHERE name = $1 AND user_id = $2',
      [name, userId]
    );
    return rows[0] ? mapAccountRow(rows[0]) : null;
  },

  async findById(id: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT id, user_id, name, currency, initial_balance_entry_id, created_at, updated_at FROM accounts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] ? mapAccountRow(rows[0]) : null;
  },

  async create(userId: string, name: string, currency: string = 'USD') {
    const { rows } = await pool.query(
      `INSERT INTO accounts (user_id, name, currency) VALUES ($1, $2, $3) RETURNING *`,
      [userId, name, currency]
    );
    return mapAccountRow(rows[0]);
  },

  async update(id: string, userId: string, data: { name: string }) {
    const { name } = data;
    const { rows } = await pool.query(
      `UPDATE accounts SET name = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, name]
    );
    return rows[0] ? mapAccountRow(rows[0]) : null;
  },

  async setInitialBalanceEntry(id: string, userId: string, entryId: string | null) {
    const { rows } = await pool.query(
      `UPDATE accounts SET initial_balance_entry_id = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, entryId]
    );
    return rows[0] ? mapAccountRow(rows[0]) : null;
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
      `SELECT a.id, a.name, a.currency, a.initial_balance_entry_id, a.created_at, a.updated_at,
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
       GROUP BY a.id, a.name, a.currency, a.initial_balance_entry_id, a.created_at, a.updated_at
       ORDER BY a.created_at`,
      [userId]
    );
    return rows;
  },
};
