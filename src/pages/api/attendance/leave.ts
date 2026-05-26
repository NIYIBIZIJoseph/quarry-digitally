import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    if (!await hasPermission(user.userId, 'attendance:view')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { worker_id } = req.query;
    let query = `SELECT l.*, w.full_name as worker_name FROM leave_requests l JOIN workers w ON l.worker_id = w.id`;
    const params = [];
    if (worker_id) {
      query += ` WHERE l.worker_id = $1`;
      params.push(worker_id);
    }
    query += ` ORDER BY l.created_at DESC`;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    if (!await hasPermission(user.userId, 'attendance:override')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { worker_id, start_date, end_date, reason } = req.body;
    if (!worker_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO leave_requests (worker_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [worker_id, start_date, end_date, reason || null]
    );
    return res.status(201).json(result.rows[0]);
  }

  if (req.method === 'PUT') {
    if (!await hasPermission(user.userId, 'attendance:override')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });
    await pool.query(`UPDATE leave_requests SET status = $1 WHERE id = $2`, [status, id]);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}