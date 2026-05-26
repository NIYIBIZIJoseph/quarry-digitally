import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  try {
    // 1. Verify OTP
    const tableCheck = await pool.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('otp_codes', 'otp_store', 'otp_verifications')
    `);
    if (tableCheck.rows.length === 0) return res.status(500).json({ error: 'OTP table missing' });
    const otpTable = tableCheck.rows[0].table_name;

    const cols = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [otpTable]
    );
    const colNames = cols.rows.map((col: { column_name: string }) => col.column_name);
    let phoneCol = colNames.includes('phone') ? 'phone' : (colNames.includes('mobile') ? 'mobile' : 'phone');
    let otpCol = colNames.includes('otp') ? 'otp' : (colNames.includes('code') ? 'code' : 'otp');
    let expiresCol = colNames.includes('expires_at') ? 'expires_at' : (colNames.includes('expiry') ? 'expiry' : 'expires_at');

    const otpRes = await pool.query(
      `SELECT ${otpCol} FROM ${otpTable} WHERE ${phoneCol} = $1 AND ${expiresCol} > NOW()`,
      [phone]
    );
    if (otpRes.rows.length === 0 || otpRes.rows[0][otpCol] !== otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    await pool.query(`DELETE FROM ${otpTable} WHERE ${phoneCol} = $1`, [phone]);

    // 2. Find user
    const userRes = await pool.query(
      `SELECT id, phone, full_name, role, branch_id, force_password_reset FROM users WHERE phone = $1 AND deleted_at IS NULL`,
      [phone]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];

    // 3. Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        branchId: user.branch_id || null,
        forceReset: user.force_password_reset || false,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        role: user.role,
        branchId: user.branch_id,
        forceReset: user.force_password_reset,
      },
    });
  } catch (err: any) {
    console.error('❌ verify-otp error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}