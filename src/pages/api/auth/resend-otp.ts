import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });

  const normalizedPhone = phone.trim().replace(/\s/g, '');
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE phone = $1', [normalizedPhone]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3`,
      [normalizedPhone, otp, expiresAt]
    );
    console.log(`[OTP] resent for ${normalizedPhone}: ${otp}`);
    return res.status(200).json({ message: `OTP resent to ${normalizedPhone}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
