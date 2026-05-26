import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
       FROM attendance
       WHERE worker_id = $1 AND date BETWEEN $2 AND $3`,
      [id, startDate, endDate]
    );

    const summary = result.rows[0] || { total_days: 0, present_days: 0, absent_days: 0, late_days: 0 };
    return res.status(200).json(summary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch attendance summary' });
  }
}