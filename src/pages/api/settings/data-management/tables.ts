import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const tables = [
    'orders', 'users', 'workers', 'attendance', 'products', 
    'support_tickets', 'contact_messages', 'audit_logs'
  ];
  const result = [];

  for (const table of tables) {
    // Check if the table has a 'deleted_at' column
    const checkColumn = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = 'deleted_at'
       )`,
      [table]
    );
    const hasDeletedAt = checkColumn.rows[0].exists;

    let count = 0;
    if (hasDeletedAt) {
      const resCount = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted_at IS NULL`);
      count = parseInt(resCount.rows[0].count);
    } else {
      const resCount = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      count = parseInt(resCount.rows[0].count);
    }
    result.push({ name: table, count });
  }

  res.status(200).json(result);
}