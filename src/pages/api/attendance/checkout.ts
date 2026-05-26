import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!await hasPermission(user.userId, 'attendance:override')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { worker_id, datetime } = req.body;
  if (!worker_id) return res.status(400).json({ error: 'worker_id required' });

  const now = datetime ? new Date(datetime) : new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);

  try {
    const result = await pool.query(
      `UPDATE attendance SET check_out = $1
       WHERE worker_id = $2 AND date = $3 AND check_out IS NULL
       RETURNING id`,
      [time, worker_id, date]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No check-in found for today' });
    }
    return res.status(200).json({ message: 'Checked out' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Check-out failed' });
  }
}