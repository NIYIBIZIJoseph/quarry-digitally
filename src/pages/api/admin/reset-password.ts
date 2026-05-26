import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, newPassword } = req.body;
  if (!phone || !newPassword) return res.status(400).json({ error: 'Missing phone or password' });
  
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE phone = $2', [hashed, phone]);
  
  res.status(200).json({ success: true });
}