import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { table } = req.query;
  if (!table) return res.status(400).json({ error: 'Table name required' });
  const allowedTables = ['orders', 'users', 'workers', 'attendance', 'products', 'support_tickets', 'contact_messages'];
  if (!allowedTables.includes(table as string)) {
    return res.status(400).json({ error: 'Invalid table' });
  }
  const result = await pool.query(`SELECT * FROM ${table} WHERE deleted_at IS NULL ORDER BY id`);
  res.status(200).json(result.rows);
}