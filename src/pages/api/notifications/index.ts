import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Get notifications for the logged-in user only
    const result = await pool.query(
      `SELECT id, title, message, type, is_read, created_at, link, priority
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [user.userId]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(200).json([]);
  }
}