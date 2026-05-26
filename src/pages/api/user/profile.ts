import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // GET current profile
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT id, full_name, phone, email, profile_image, two_factor_enabled
       FROM users WHERE id = $1`,
      [user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(result.rows[0]);
  }

  // PUT update profile
  if (req.method === 'PUT') {
    const { full_name, phone, email, profile_image } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (full_name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
    if (profile_image !== undefined) { updates.push(`profile_image = $${idx++}`); values.push(profile_image); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(user.userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);

    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'user_profile',
      targetId: user.userId,
      newData: req.body,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    const updated = await pool.query(
      `SELECT id, full_name, phone, email, profile_image, two_factor_enabled
       FROM users WHERE id = $1`,
      [user.userId]
    );
    return res.status(200).json(updated.rows[0]);
  }

  res.status(405).end();
}