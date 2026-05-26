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

  const { whereClause, params } = enforceBranchIsolation(user, 'p', 'branch_id');

  // Fast moving (sold in last 30 days)
  const fastMovingRes = await pool.query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at > NOW() - INTERVAL '30 days'
      AND o.status IN ('approved', 'delivered')
      AND p.deleted_at IS NULL
      ${whereClause}
  `, params);
  const fastMoving = parseInt(fastMovingRes.rows[0].count);

  // Slow moving (has stock but no sales in 30 days)
  const slowMovingRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM products p
    WHERE p.stock_quantity > 0
      AND NOT EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = p.id
          AND o.created_at > NOW() - INTERVAL '30 days'
      )
      AND p.deleted_at IS NULL
      ${whereClause}
  `, params);
  const slowMoving = parseInt(slowMovingRes.rows[0].count);

  // Dead stock (stock = 0)
  const deadStockRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM products p
    WHERE p.stock_quantity = 0
      AND p.deleted_at IS NULL
      ${whereClause}
  `, params);
  const deadStock = parseInt(deadStockRes.rows[0].count);

  // Turnover rate
  const turnoverRes = await pool.query(`
    SELECT COALESCE(SUM(oi.quantity), 0) as sold,
           COALESCE(AVG(p.stock_quantity), 1) as avg_stock
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at > NOW() - INTERVAL '30 days' AND o.status IN ('approved', 'delivered')
    WHERE p.deleted_at IS NULL ${whereClause}
  `, params);
  const sold = parseInt(turnoverRes.rows[0].sold);
  const avgStock = parseFloat(turnoverRes.rows[0].avg_stock);
  const turnoverRate = avgStock > 0 ? sold / avgStock : 0;

  // Product sales for chart (top 10 by units sold)
  const productSales = await pool.query(`
    SELECT p.name, COALESCE(SUM(oi.quantity), 0) as sold_units
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at > NOW() - INTERVAL '30 days' AND o.status IN ('approved', 'delivered')
    WHERE p.deleted_at IS NULL ${whereClause}
    GROUP BY p.id, p.name
    ORDER BY sold_units DESC
    LIMIT 10
  `, params);

  res.status(200).json({
    fastMoving,
    slowMoving,
    deadStock,
    turnoverRate,
    productSales: productSales.rows,
  });
}