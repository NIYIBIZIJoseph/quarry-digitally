import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'dashboard:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await pool.query(`
    SELECT action, target_type, created_at
    FROM audit_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `, [user.userId]);

  const activities = result.rows.map(row => ({
    action: row.action,
    target_type: row.target_type,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));

  res.status(200).json(activities);
}