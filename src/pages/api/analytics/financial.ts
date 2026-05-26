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

  const { whereClause, params } = enforceBranchIsolation(user, 'o', 'branch_id');

  // Daily revenue last 30 days – only approved/delivered orders
  const revenueDaily = await pool.query(`
    SELECT DATE(o.created_at) as date, COALESCE(SUM(o.total_amount), 0) as revenue
    FROM orders o
    WHERE o.status IN ('approved', 'delivered')
      AND o.created_at >= CURRENT_DATE - INTERVAL '29 days'
      ${whereClause}
    GROUP BY DATE(o.created_at)
    ORDER BY date ASC
  `, params);

  // Top products by revenue
  const topProducts = await pool.query(`
    SELECT p.name, COALESCE(SUM(oi.subtotal), 0) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status IN ('approved', 'delivered')
      AND o.deleted_at IS NULL
      ${whereClause}
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT 10
  `, params);

  res.status(200).json({ revenueDaily: revenueDaily.rows, topProducts: topProducts.rows });
}