import { pool } from '../config/database';

export const categoryRepo = {
  async findAllByUser(userId: string) {
    const { rows } = await pool.query(
      `SELECT id, user_id, name, color, icon, is_income, sort_order, created_at
       FROM categories WHERE user_id = $1 ORDER BY sort_order, name`,
      [userId]
    );
    return rows;
  },

  async findById(id: string, userId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId: string, name: string, color: string, icon: string | null, isIncome: boolean) {
    const { rows } = await pool.query(
      `INSERT INTO categories (user_id, name, color, icon, is_income)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, color, icon, is_income, sort_order, created_at`,
      [userId, name, color, icon, isIncome]
    );
    return rows[0];
  },

  async update(id: string, userId: string, data: { name?: string; color?: string; icon?: string; sortOrder?: number }) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 3;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.color !== undefined) { fields.push(`color = $${idx++}`); values.push(data.color); }
    if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(data.icon); }
    if (data.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

    if (fields.length === 0) return this.findById(id, userId);

    const { rows } = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, name, color, icon, is_income, sort_order, created_at`,
      [id, userId, ...values]
    );
    return rows[0] || null;
  },

  async delete(id: string, userId: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  },
};
