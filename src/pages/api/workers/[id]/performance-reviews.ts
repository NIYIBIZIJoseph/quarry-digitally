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
        'SELECT * FROM performance_reviews WHERE worker_id = $1 ORDER BY review_date DESC',
        [id]
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch performance reviews' });
    }
  }

  if (req.method === 'POST') {
    const { review_date, reviewer, rating, comments } = req.body;
    if (!review_date || !rating) {
      return res.status(400).json({ message: 'Review date and rating required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO performance_reviews (worker_id, review_date, reviewer, rating, comments)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, review_date, reviewer || null, rating, comments || null]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to add performance review' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}