import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user || !(await hasPermission(user.userId, 'admin:controls'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Log the action (no actual cache clearing)
  await logAudit({
    userId: user.userId,
    action: 'CLEAR_CACHE',
    targetType: 'system',
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'Cache clear logged (no cache implemented)' });
}