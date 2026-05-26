import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);

  // ========== GET (public) ==========
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT id, name, role, bio, image_url, sort_order, is_active
         FROM team_members
         WHERE is_active = true
         ORDER BY sort_order ASC, id ASC`
      );
      return res.status(200).json(result.rows);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ========== POST (admin only) ==========
  if (req.method === 'POST') {
    if (!user || !(await hasPermission(user.userId, 'settings:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, role, bio, image_url, sort_order, is_active } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }
    const result = await pool.query(
      `INSERT INTO team_members (name, role, bio, image_url, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, role, bio || '', image_url || '', sort_order || 0, is_active !== false]
    );
    return res.status(201).json(result.rows[0]);
  }

  res.status(405).end();
}