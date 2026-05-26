import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, hasPermission } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  res.status(200).json({ valid: true, user });
}
