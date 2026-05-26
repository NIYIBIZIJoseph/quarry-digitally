import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT key, value FROM user_preferences WHERE user_id = $1',
      [user.userId]
    );
    const prefs: Record<string, string> = {};
    result.rows.forEach(row => { prefs[row.key] = row.value; });
    return res.status(200).json(prefs);
  }

  if (req.method === 'PUT') {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid update object' });
    }
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'string') continue;
      await pool.query(
        `INSERT INTO user_preferences (user_id, key, value, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [user.userId, key, value]
      );
    }
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}