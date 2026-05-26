import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tempToken, code } = req.body;
  if (!tempToken || !code) return res.status(400).json({ error: 'Missing temporary token or code' });

  try {
    // Verify temporary token
    const decoded = jwt.verify(tempToken, JWT_SECRET) as { userId: number; step: string };
    if (decoded.step !== '2fa') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Fetch user's 2FA secret
    const userRes = await pool.query('SELECT two_factor_secret, full_name, branch_id, role_id FROM users WHERE id = $1', [decoded.userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];
    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA not set up for this user' });
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Issue full token
    const token = jwt.sign(
      {
        userId: decoded.userId,
        phone: userRes.rows[0].phone,
        roleId: user.role_id,
        branchId: user.branch_id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: decoded.userId,
        fullName: user.full_name,
        branchId: user.branch_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
}