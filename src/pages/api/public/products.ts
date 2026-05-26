import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.price, p.stock_quantity, p.description, p.image_url, p.reorder_level,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND (p.deleted_at IS NULL OR p.deleted_at = '1970-01-01')
      ORDER BY p.id DESC
    `);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}