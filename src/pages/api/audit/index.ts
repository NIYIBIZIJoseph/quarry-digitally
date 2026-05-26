import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'audit:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countRes = await pool.query('SELECT COUNT(*) FROM audit_logs');
  const total = parseInt(countRes.rows[0].count);

  res.status(200).json({
    data: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}