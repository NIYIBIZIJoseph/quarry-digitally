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
        'SELECT * FROM salary_history WHERE worker_id = $1 ORDER BY effective_date DESC',
        [id]
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch salary history' });
    }
  }

  if (req.method === 'POST') {
    const { old_salary, new_salary, effective_date, reason } = req.body;
    if (!new_salary || !effective_date) {
      return res.status(400).json({ message: 'New salary and effective date required' });
    }
    try {
      await pool.query(
        `INSERT INTO salary_history (worker_id, old_salary, new_salary, effective_date, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, old_salary || null, new_salary, effective_date, reason || null]
      );
      await pool.query('UPDATE workers SET salary = $1 WHERE id = $2', [new_salary, id]);
      return res.status(201).json({ message: 'Salary history added' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to add salary history' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}