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

  const settings = await pool.query("SELECT value FROM attendance_settings WHERE key = 'work_start_time'");
  const workStart = settings.rows[0]?.value || '08:00';
  const isLate = time > workStart;

  try {
    const existing = await pool.query(
      'SELECT id FROM attendance WHERE worker_id = $1 AND date = $2',
      [worker_id, date]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    await pool.query(
      `INSERT INTO attendance (worker_id, date, check_in, is_late, status)
       VALUES ($1, $2, $3, $4, 'present')`,
      [worker_id, date, time, isLate]
    );
    return res.status(200).json({ message: 'Checked in', isLate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Check-in failed' });
  }
}