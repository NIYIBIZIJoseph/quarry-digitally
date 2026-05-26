import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { permission } = req.query;
  if (!permission) return res.status(400).json({ error: 'Permission required' });
  const allowed = await hasPermission(user.userId, permission as string);
  res.status(200).json({ hasPermission: allowed });
}