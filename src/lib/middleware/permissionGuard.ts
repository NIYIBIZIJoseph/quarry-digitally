import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, hasPermission } from '../auth';

export function requirePermission(permission: string) {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const allowed = await hasPermission(user.userId, permission);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    (req as any).authUser = user; // attach for later use
    next();
  };
}