import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const user = verifyToken(req);
  if (!user || !hasRole(user, ['admin', 'superadmin'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'DELETE') {
    const userId = user.userId;
    await pool.query(
      'UPDATE attendance SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
      [userId, id]
    );
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end();
}