import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(`
      SELECT p.name, SUM(o.quantity) as total_sold
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.created_at > NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch top products' });
  }
}
