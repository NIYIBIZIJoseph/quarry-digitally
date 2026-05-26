import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'analytics:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params } = enforceBranchIsolation(user, 'b', 'id');

  const query = `
    SELECT 
      b.name as branch,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      ROUND(COALESCE(AVG(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) * 100, 1) as attendance,
      COUNT(DISTINCT o.id) as orders
    FROM branches b
    LEFT JOIN orders o ON o.branch_id = b.id AND o.status IN ('approved', 'delivered') AND o.deleted_at IS NULL
    LEFT JOIN workers w ON w.branch_id = b.id AND w.deleted_at IS NULL
    LEFT JOIN attendance a ON a.worker_id = w.id AND a.date = CURRENT_DATE
    WHERE 1=1 ${whereClause.replace(/b\.id/g, 'b.id')}
    GROUP BY b.id, b.name
    ORDER BY revenue DESC
  `;
  const result = await pool.query(query, params);
  res.status(200).json(result.rows);
}