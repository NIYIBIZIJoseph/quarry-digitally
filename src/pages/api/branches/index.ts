import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const result = await pool.query('SELECT id, name FROM branches WHERE deleted_at IS NULL ORDER BY name');
    return res.status(200).json(result.rows);
  }
  res.status(405).end();
}