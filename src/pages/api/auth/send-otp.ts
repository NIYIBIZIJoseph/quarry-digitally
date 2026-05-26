import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

  try {
    // 1. Find user – ONLY `password` column (your table has no password_hash)
    const userRes = await pool.query(
      `SELECT id, password FROM users WHERE phone = $1 AND deleted_at IS NULL`,
      [phone]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Find OTP table (auto-detect)
    const tableCheck = await pool.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('otp_codes', 'otp_store', 'otp_verifications')
    `);
    if (tableCheck.rows.length === 0) {
      return res.status(500).json({ error: 'OTP table missing' });
    }
    const otpTable = tableCheck.rows[0].table_name;

    // Detect column names
    const cols = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [otpTable]
    );
    const colNames = cols.rows.map((col: { column_name: string }) => col.column_name);
    let phoneCol = colNames.includes('phone') ? 'phone' : (colNames.includes('mobile') ? 'mobile' : 'phone');
    let otpCol = colNames.includes('otp') ? 'otp' : (colNames.includes('code') ? 'code' : 'otp');
    let expiresCol = colNames.includes('expires_at') ? 'expires_at' : (colNames.includes('expiry') ? 'expiry' : 'expires_at');

    await pool.query(
      `INSERT INTO ${otpTable} (${phoneCol}, ${otpCol}, ${expiresCol}) VALUES ($1, $2, $3)
       ON CONFLICT (${phoneCol}) DO UPDATE SET ${otpCol} = EXCLUDED.${otpCol}, ${expiresCol} = EXCLUDED.${expiresCol}`,
      [phone, otp, expiresAt]
    );

    console.log(`📱 OTP for ${phone}: ${otp}`);
    return res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (err: any) {
    console.error('❌ send-otp error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}