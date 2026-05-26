import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      'SELECT modules FROM role_dashboard_config WHERE role_name = $1',
      [user.role]
    );

    if (result.rows.length === 0) {
      // Fallback: return basic modules if role not configured
      return res.status(200).json({ modules: ['workforce', 'support', 'attendanceSnapshot'] });
    }

    res.status(200).json({ modules: result.rows[0].modules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard config' });
  }
}