import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await pool.query(`
      SELECT id, question, answer, category
      FROM faq_items
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}