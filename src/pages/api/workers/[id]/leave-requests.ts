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

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM leave_requests WHERE worker_id = $1 ORDER BY created_at DESC',
        [id]
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch leave requests' });
    }
  }

  if (req.method === 'POST') {
    const { start_date, end_date, reason } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO leave_requests (worker_id, start_date, end_date, reason, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
        [id, start_date, end_date, reason || null]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to create leave request' });
    }
  }

  if (req.method === 'PUT') {
    const { leave_id, status } = req.body;
    if (!leave_id || !status) {
      return res.status(400).json({ message: 'Leave ID and status required' });
    }
    try {
      await pool.query(
        `UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3 AND worker_id = $4`,
        [status, user.userId, leave_id, id]
      );
      return res.status(200).json({ message: 'Leave request updated' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to update leave request' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}