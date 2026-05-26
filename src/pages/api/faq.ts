import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Public GET – no authentication required
  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT id, question, answer, category, sort_order, is_active FROM faq_items WHERE is_active = true ORDER BY sort_order'
    );
    return res.status(200).json(result.rows);
  }

  // All other methods require authentication and permission
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Check for 'faq:manage' permission (admin or superadmin)
  if (!(await hasPermission(user.userId, 'faq:manage'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // POST – create new FAQ
  if (req.method === 'POST') {
    const { question, answer, category, sort_order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const result = await pool.query(
      `INSERT INTO faq_items (question, answer, category, sort_order) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [question, answer, category || null, sort_order || 0]
    );
    return res.status(201).json(result.rows[0]);
  }

  // PUT – update existing FAQ
  if (req.method === 'PUT') {
    const { id, question, answer, category, sort_order, is_active } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    await pool.query(
      `UPDATE faq_items 
       SET question = $1, answer = $2, category = $3, sort_order = $4, is_active = $5 
       WHERE id = $6`,
      [question, answer, category, sort_order, is_active, id]
    );
    return res.status(200).json({ message: 'Updated' });
  }

  // DELETE – remove FAQ
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    await pool.query('DELETE FROM faq_items WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}