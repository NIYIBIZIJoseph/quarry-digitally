import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'roles:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const result = await pool.query('SELECT id, name, description FROM permissions ORDER BY name');
  res.status(200).json(result.rows);
}