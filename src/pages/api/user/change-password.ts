import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [user.userId]);
  if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(oldPassword, userRes.rows[0].password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.userId]);

  await logAudit({
    userId: user.userId,
    action: 'CHANGE_PASSWORD',
    targetType: 'user',
    targetId: user.userId,
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
}