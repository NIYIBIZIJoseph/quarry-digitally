import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT key, value, description FROM system_settings
       WHERE key LIKE 'inventory_%' ORDER BY key`
    );
    return res.status(200).json(result.rows); // returns array
  }
  // ... PUT handling
}