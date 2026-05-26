import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'order:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params } = enforceBranchIsolation(user, 'o', 'branch_id');

  const query = `
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.created_at > NOW() - INTERVAL '30 days'
      AND o.deleted_at IS NULL
      ${whereClause}
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5
  `;
  const result = await pool.query(query, params);
  // ✅ Return only the array, not wrapped in an object
  return res.status(200).json(result.rows);
}