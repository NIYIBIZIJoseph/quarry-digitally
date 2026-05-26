import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await pool.query(
    `UPDATE users SET two_factor_secret = NULL, two_factor_backup_codes = NULL, two_factor_enabled = false WHERE id = $1`,
    [user.userId]
  );

  await logAudit({
    userId: user.userId,
    action: 'DISABLE_2FA',
    targetType: 'user',
    targetId: user.userId,
    newData: { two_factor_enabled: false },
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: '2FA disabled' });
}