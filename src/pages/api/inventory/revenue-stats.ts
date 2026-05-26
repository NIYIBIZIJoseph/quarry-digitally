import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'inventory:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Branch isolation for orders (revenue belongs to order branch)
  const { whereClause, params } = enforceBranchIsolation(user, 'o', 'branch_id');

  // Total revenue from **approved** orders (or delivered, but approved exists)
  const totalQuery = `
    SELECT COALESCE(SUM(oi.subtotal), 0) as total
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.status = 'approved'
    ${whereClause}
  `;
  const totalRes = await pool.query(totalQuery, params);
  const totalRevenue = Number(totalRes.rows[0]?.total || 0);

  // Per‑product revenue (using order_items, filtered by branch)
  const perProductQuery = `
    SELECT p.id, p.name, COALESCE(SUM(oi.subtotal), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'approved' ${whereClause}
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
  `;
  const perProductRes = await pool.query(perProductQuery, params);

  return res.status(200).json({
    totalRevenue,
    perProductRevenue: perProductRes.rows,
  });
}