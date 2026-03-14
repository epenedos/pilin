import { pool } from '../config/database';

export const entryRepo = {
  async findFiltered(userId: string, filters: {
    type?: string;
    from?: string;
    to?: string;
    categoryId?: string;
    accountId?: string;
    page: number;
    limit: number;
  }) {
    const conditions = ['me.user_id = $1', 'me.excluded = FALSE', '(me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)'];
    const values: any[] = [userId];
    let idx = 2;

    if (filters.type) { conditions.push(`me.type = $${idx++}`); values.push(filters.type); }
    if (filters.from) { conditions.push(`me.entry_date >= $${idx++}`); values.push(filters.from); }
    if (filters.to) { conditions.push(`me.entry_date <= $${idx++}`); values.push(filters.to); }
    if (filters.categoryId) { conditions.push(`me.category_id = $${idx++}`); values.push(filters.categoryId); }
    if (filters.accountId) { conditions.push(`(me.account_id = $${idx} OR me.to_account_id = $${idx++})`); values.push(filters.accountId); }

    const where = conditions.join(' AND ');
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM money_entries me WHERE ${where}`,
      values
    );

    const { rows } = await pool.query(
      `SELECT me.*, c.name as category_name, c.color as category_color,
              a.name as account_name, ta.name as to_account_name
       FROM money_entries me
       LEFT JOIN categories c ON c.id = me.category_id
       LEFT JOIN accounts a ON a.id = me.account_id
       LEFT JOIN accounts ta ON ta.id = me.to_account_id
       WHERE ${where}
       ORDER BY me.entry_date DESC, me.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, filters.limit, offset]
    );

    return { data: rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async findById(id: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM money_entries WHERE id = $1 AND user_id = $2 AND excluded = FALSE',
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(data: {
    userId: string;
    categoryId: string | null;
    accountId: string;
    toAccountId?: string | null;
    type: string;
    amount: number;
    currency: string;
    convertedAmount?: number | null;
    exchangeRate?: number | null;
    description: string;
    entryDate: string;
    isRecurring: boolean;
    recurrence?: string | null;
    recurrenceStart?: string | null;
    recurrenceEnd?: string | null;
    parentRecurringId?: string | null;
  }) {
    const { rows } = await pool.query(
      `INSERT INTO money_entries
       (user_id, category_id, account_id, to_account_id, type, amount, currency,
        converted_amount, exchange_rate, description, entry_date,
        is_recurring, recurrence, recurrence_start, recurrence_end, parent_recurring_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        data.userId, data.categoryId || null, data.accountId, data.toAccountId || null,
        data.type, data.amount, data.currency,
        data.convertedAmount ?? null, data.exchangeRate ?? null,
        data.description, data.entryDate, data.isRecurring, data.recurrence || null,
        data.recurrenceStart || null, data.recurrenceEnd || null,
        data.parentRecurringId || null,
      ]
    );
    return rows[0];
  },

  async update(id: string, userId: string, data: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    currency?: string;
    convertedAmount?: number | null;
    exchangeRate?: number | null;
    description?: string;
    entryDate?: string;
  }) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 3;

    if (data.categoryId !== undefined) { fields.push(`category_id = $${idx++}`); values.push(data.categoryId); }
    if (data.accountId !== undefined) { fields.push(`account_id = $${idx++}`); values.push(data.accountId); }
    if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount); }
    if (data.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(data.currency); }
    if (data.convertedAmount !== undefined) { fields.push(`converted_amount = $${idx++}`); values.push(data.convertedAmount); }
    if (data.exchangeRate !== undefined) { fields.push(`exchange_rate = $${idx++}`); values.push(data.exchangeRate); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.entryDate !== undefined) { fields.push(`entry_date = $${idx++}`); values.push(data.entryDate); }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) return this.findById(id, userId);

    const { rows } = await pool.query(
      `UPDATE money_entries SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, ...values]
    );
    return rows[0] || null;
  },

  async delete(id: string, userId: string) {
    // Check if this is a generated recurring entry
    const { rows: entry } = await pool.query(
      'SELECT parent_recurring_id FROM money_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (!entry[0]) return false;

    if (entry[0].parent_recurring_id) {
      // Soft-delete generated recurring entries so they aren't regenerated
      const { rowCount } = await pool.query(
        'UPDATE money_entries SET excluded = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return (rowCount ?? 0) > 0;
    }

    // Hard-delete one-time entries
    const { rowCount } = await pool.query(
      'DELETE FROM money_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async findRecurringDefinitions(userId: string) {
    const { rows } = await pool.query(
      `SELECT me.*, c.name as category_name, c.color as category_color,
              a.name as account_name
       FROM money_entries me
       LEFT JOIN categories c ON c.id = me.category_id
       LEFT JOIN accounts a ON a.id = me.account_id
       WHERE me.user_id = $1 AND me.is_recurring = TRUE AND me.parent_recurring_id IS NULL
       ORDER BY me.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async updateRecurring(id: string, userId: string, data: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    currency?: string;
    convertedAmount?: number | null;
    exchangeRate?: number | null;
    description?: string;
    recurrence?: string;
    recurrenceEnd?: string | null;
  }) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 3;

    if (data.categoryId !== undefined) { fields.push(`category_id = $${idx++}`); values.push(data.categoryId); }
    if (data.accountId !== undefined) { fields.push(`account_id = $${idx++}`); values.push(data.accountId); }
    if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount); }
    if (data.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(data.currency); }
    if (data.convertedAmount !== undefined) { fields.push(`converted_amount = $${idx++}`); values.push(data.convertedAmount); }
    if (data.exchangeRate !== undefined) { fields.push(`exchange_rate = $${idx++}`); values.push(data.exchangeRate); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.recurrence !== undefined) { fields.push(`recurrence = $${idx++}`); values.push(data.recurrence); }
    if (data.recurrenceEnd !== undefined) { fields.push(`recurrence_end = $${idx++}`); values.push(data.recurrenceEnd); }

    fields.push(`updated_at = NOW()`);

    const { rows } = await pool.query(
      `UPDATE money_entries SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2 AND is_recurring = TRUE AND parent_recurring_id IS NULL
       RETURNING *`,
      [id, userId, ...values]
    );
    return rows[0] || null;
  },

  async deleteRecurring(id: string, userId: string, deleteGenerated: boolean) {
    if (deleteGenerated) {
      await pool.query(
        'DELETE FROM money_entries WHERE parent_recurring_id = $1 AND user_id = $2',
        [id, userId]
      );
    }
    const { rowCount } = await pool.query(
      'DELETE FROM money_entries WHERE id = $1 AND user_id = $2 AND is_recurring = TRUE AND parent_recurring_id IS NULL',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },

  async findGeneratedByParentAndDate(parentId: string, entryDate: string) {
    const { rows } = await pool.query(
      'SELECT id FROM money_entries WHERE parent_recurring_id = $1 AND entry_date = $2',
      [parentId, entryDate]
    );
    return rows[0] || null;
  },

  // Aggregation queries
  async sumByTypeAndDateRange(userId: string, type: string, from: string, to: string) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM money_entries
       WHERE user_id = $1 AND type = $2 AND entry_date >= $3 AND entry_date <= $4
         AND excluded = FALSE
         AND (parent_recurring_id IS NOT NULL OR is_recurring = FALSE)`,
      [userId, type, from, to]
    );
    return parseFloat(rows[0].total);
  },

  async sumByTypeUpToDate(userId: string, type: string, upTo: string) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM money_entries
       WHERE user_id = $1 AND type = $2 AND entry_date <= $3
         AND excluded = FALSE
         AND (parent_recurring_id IS NOT NULL OR is_recurring = FALSE)`,
      [userId, type, upTo]
    );
    return parseFloat(rows[0].total);
  },

  async sumByCategoryAndDateRange(userId: string, type: string, from: string, to: string) {
    const { rows } = await pool.query(
      `SELECT me.category_id, c.name as category_name, c.color as category_color,
              COALESCE(SUM(me.amount), 0) as total
       FROM money_entries me
       JOIN categories c ON c.id = me.category_id
       WHERE me.user_id = $1 AND me.type = $2 AND me.entry_date >= $3 AND me.entry_date <= $4
         AND me.excluded = FALSE
         AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
       GROUP BY me.category_id, c.name, c.color
       ORDER BY total DESC`,
      [userId, type, from, to]
    );
    return rows;
  },

  async findByTypeAndDateRange(userId: string, type: string, from: string, to: string) {
    const { rows } = await pool.query(
      `SELECT me.*, c.name as category_name, c.color as category_color
       FROM money_entries me
       JOIN categories c ON c.id = me.category_id
       WHERE me.user_id = $1 AND me.type = $2 AND me.entry_date >= $3 AND me.entry_date <= $4
         AND me.excluded = FALSE
         AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
       ORDER BY me.amount DESC`,
      [userId, type, from, to]
    );
    return rows;
  },

  async monthlyTotalsByCategory(userId: string, year: number) {
    const { rows } = await pool.query(
      `SELECT DATE_TRUNC('month', me.entry_date) as month,
              me.category_id, c.name as category_name, c.color as category_color,
              me.type, COALESCE(SUM(me.amount), 0) as total
       FROM money_entries me
       JOIN categories c ON c.id = me.category_id
       WHERE me.user_id = $1
         AND EXTRACT(YEAR FROM me.entry_date) = $2
         AND me.excluded = FALSE
         AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
         AND me.type != 'transfer'
       GROUP BY month, me.category_id, c.name, c.color, me.type
       ORDER BY month`,
      [userId, year]
    );
    return rows;
  },

  async recentEntries(userId: string, limit: number) {
    const { rows } = await pool.query(
      `SELECT me.id, me.description, me.amount, me.type, me.entry_date,
              me.account_id, me.to_account_id,
              c.name as category_name, c.color as category_color,
              a.name as account_name, ta.name as to_account_name
       FROM money_entries me
       LEFT JOIN categories c ON c.id = me.category_id
       LEFT JOIN accounts a ON a.id = me.account_id
       LEFT JOIN accounts ta ON ta.id = me.to_account_id
       WHERE me.user_id = $1
         AND me.excluded = FALSE
         AND (me.parent_recurring_id IS NOT NULL OR me.is_recurring = FALSE)
       ORDER BY me.entry_date DESC, me.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },

  async activeRecurringDefinitions(userId: string) {
    const { rows } = await pool.query(
      `SELECT me.*, c.name as category_name, a.name as account_name
       FROM money_entries me
       LEFT JOIN categories c ON c.id = me.category_id
       LEFT JOIN accounts a ON a.id = me.account_id
       WHERE me.user_id = $1 AND me.is_recurring = TRUE AND me.parent_recurring_id IS NULL
         AND (me.recurrence_end IS NULL OR me.recurrence_end > CURRENT_DATE)
       ORDER BY me.type, me.amount DESC`,
      [userId]
    );
    return rows;
  },

  async futureOneTimeEntries(userId: string) {
    const { rows } = await pool.query(
      `SELECT * FROM money_entries
       WHERE user_id = $1 AND is_recurring = FALSE AND excluded = FALSE AND entry_date > CURRENT_DATE
       ORDER BY entry_date`,
      [userId]
    );
    return rows;
  },
};
