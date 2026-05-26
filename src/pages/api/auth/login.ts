import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.phone, u.password, u.branch_id, u.force_password_reset,
              u.two_factor_enabled, r.id as role_id, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.phone = $1 AND u.deleted_at IS NULL`,
      [phone]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    // If 2FA enabled, create a temporary token (short-lived) and ask for code
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { userId: user.id, step: '2fa', phone: user.phone },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({
        requiresTwoFactor: true,
        tempToken,
        userId: user.id,
        message: 'Two‑factor authentication required',
      });
    }

    // No 2FA → issue full token with role and branchId
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,            // role name from DB
        branchId: user.branch_id,   // branch ID from DB
        forceReset: user.force_password_reset,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}