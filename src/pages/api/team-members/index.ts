import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ✅ ADD GET METHOD - For admin to fetch team members
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT 
        id, name, role, bio, image_url, sort_order, is_active
       FROM team_members
       ORDER BY sort_order ASC, id ASC`
    );
    return res.status(200).json(result.rows);
  }
  
  // POST admin only
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'settings:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, role, bio, image_url, sort_order, is_active } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const result = await pool.query(
      `INSERT INTO team_members
       (name, role, bio, image_url, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [name, role, bio || '', image_url || '', sort_order || 0, is_active !== false]
    );

    return res.status(201).json(result.rows[0]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});