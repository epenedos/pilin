import { pool } from '../config/database';

export const budgetRepo = {
  async findByMonth(userId: string, month: string) {
    const { rows } = await pool.query(
      `SELECT b.id, b.user_id, b.category_id, b.month, b.amount,
              c.name as category_name, c.color as category_color,
              COALESCE(
                (SELECT SUM(me.amount) FROM money_entries me
                 WHERE me.user_id = b.user_id AND me.category_id = b.category_id
                   AND me.type = 'expense'
                   AND me.entry_date >= b.month
                   AND me.entry_date < (b.month + INTERVAL '1 month')::date
                   AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
                ), 0
              ) as spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1 AND b.month = $2
       ORDER BY c.name`,
      [userId, month]
    );
    return rows;
  },

  async findById(id: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId: string, categoryId: string, month: string, amount: number) {
    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, category_id, month, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, categoryId, month, amount]
    );
    return rows[0];
  },

  async update(id: string, userId: string, amount: number) {
    const { rows } = await pool.query(
      `UPDATE budgets SET amount = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, amount]
    );
    return rows[0] || null;
  },

  async delete(id: string, userId: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async copyBudgets(userId: string, fromMonth: string, toMonth: string) {
    const { rows } = await pool.query(
      `INSERT INTO budgets (user_id, category_id, month, amount)
       SELECT user_id, category_id, $3, amount
       FROM budgets
       WHERE user_id = $1 AND month = $2
       ON CONFLICT (user_id, category_id, month) DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
       RETURNING *`,
      [userId, fromMonth, toMonth]
    );
    return rows;
  },
};
