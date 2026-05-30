import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.description,
        p.image_url,
        p.stock_quantity,
        p.unit,
        c.name as category_name,
        p.reorder_level
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true 
        AND p.deleted_at IS NULL
        AND p.stock_quantity > 0
    `;
    
    const params: any[] = [];
    
    if (category && category !== 'all') {
      query += ` AND c.name = $1`;
      params.push(category);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}