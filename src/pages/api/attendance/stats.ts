import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!await hasPermission(user.userId, 'attendance:view')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params } = enforceBranchIsolation(user, 'a', 'branch_id');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date();
  const query = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) FILTER (WHERE status = 'late') as late,
      COUNT(*) FILTER (WHERE status = 'absent') as absent,
      COUNT(*) as total
    FROM attendance a
    WHERE date BETWEEN $1 AND $2 AND a.deleted_at IS NULL ${whereClause}
  `;
  const result = await pool.query(query, [startOfMonth.toISOString().slice(0,10), endOfMonth.toISOString().slice(0,10), ...params]);
  res.status(200).json(result.rows[0]);
}