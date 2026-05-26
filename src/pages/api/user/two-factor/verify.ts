import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { secret, token } = req.body;
  if (!secret || !token) return res.status(400).json({ error: 'Secret and verification code required' });

  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!verified) return res.status(400).json({ error: 'Invalid verification code' });

  const backupCodes = Array.from({ length: 10 }, () => Math.floor(10000000 + Math.random() * 90000000).toString());

  await pool.query(
    `UPDATE users
     SET two_factor_secret = $1, two_factor_backup_codes = $2, two_factor_enabled = true
     WHERE id = $3`,
    [secret, backupCodes, user.userId]
  );

  await logAudit({
    userId: user.userId,
    action: 'ENABLE_2FA',
    targetType: 'user',
    targetId: user.userId,
    newData: { two_factor_enabled: true },
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: '2FA enabled', backupCodes });
}