import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'dashboard:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let branchFilter = '';
  let branchParams: any[] = [];
  if (user.roleId !== 1 && user.branchId) {
    branchFilter = ' AND branch_id = $1';
    branchParams = [user.branchId];
  }

  const result = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM orders
    WHERE deleted_at IS NULL
      ${branchFilter}
    GROUP BY status
  `, branchParams);

  res.status(200).json(result.rows);
}