import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT * FROM stock_logs WHERE product_id = $1 ORDER BY created_at DESC`,
        [id]
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch logs' });
    }
  }
  res.status(405).end();
}