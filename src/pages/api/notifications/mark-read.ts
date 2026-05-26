import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id, all } = req.body;

  try {
    if (id && !all) {
      // Mark single notification as read
      await pool.query(
        `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
        [id, user.userId]
      );
      return res.status(200).json({ success: true });
    }
    
    if (all === true) {
      // Mark all notifications as read for this user
      await pool.query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
        [user.userId]
      );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Missing id or all flag' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update notification status' });
  }
}