import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Permission check
    if (!await hasPermission(user.userId, 'attendance:override')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { worker_id, date, status, reason } = req.body;
    if (!worker_id || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const localDate = String(date).split('T')[0];

    const existing = await pool.query(
      `SELECT * FROM attendance WHERE worker_id = $1 AND date::date = $2::date AND deleted_at IS NULL LIMIT 1`,
      [worker_id, localDate]
    );

    let result;

    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE attendance SET status = $1, manual_override = true, override_reason = $2, is_late = $3 WHERE id = $4 RETURNING *`,
        [status, reason || 'Manual override', status === 'late', existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO attendance (worker_id, date, status, is_late, manual_override, override_reason, branch_id)
         VALUES ($1, $2::date, $3, $4, true, $5, $6) RETURNING *`,
        [worker_id, localDate, status, status === 'late', reason || 'Manual override', user.branchId || null]
      );
    }

    console.log('Override Success:', result.rows[0]);
    return res.status(200).json(result.rows[0]);
  } catch (err: any) {
    console.error('Override API error:', err);
    return res.status(500).json({ error: err.message });
  }
}