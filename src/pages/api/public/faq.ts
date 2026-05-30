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
        id,
        question,
        answer,
        category,
        sort_order
      FROM faq_items
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    
    if (category && category !== 'all') {
      query += ` AND category = $1`;
      params.push(category);
    }
    
    query += ` ORDER BY sort_order ASC, created_at DESC`;
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('FAQ API error:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}