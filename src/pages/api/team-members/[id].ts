import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user || !(await hasPermission(user.userId, 'settings:edit'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  const memberId = parseInt(id as string);
  if (isNaN(memberId)) return res.status(400).json({ error: 'Invalid ID' });

  // ========== PUT (update) ==========
  if (req.method === 'PUT') {
    const { name, role, bio, image_url, sort_order, is_active } = req.body;
    const result = await pool.query(
      `UPDATE team_members
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           bio = COALESCE($3, bio),
           image_url = COALESCE($4, image_url),
           sort_order = COALESCE($5, sort_order),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, role, bio, image_url, sort_order, is_active, memberId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(result.rows[0]);
  }

  // ========== DELETE ==========
  if (req.method === 'DELETE') {
    await pool.query('DELETE FROM team_members WHERE id = $1', [memberId]);
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}