import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'dashboard:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ✅ Use user.role (string) instead of user.roleId
  let branchFilter = '';
  let branchParams: any[] = [];
  if (user.role !== 'superadmin' && user.branchId) {
    branchFilter = ' AND o.branch_id = $1';
    branchParams = [user.branchId];
  }

  // Total orders
  const ordersRes = await pool.query(
    `SELECT COUNT(*) as count FROM orders o WHERE o.deleted_at IS NULL ${branchFilter}`,
    branchParams
  );
  const totalOrders = parseInt(ordersRes.rows[0].count);

  // Revenue from order_items
  const revenueRes = await pool.query(`
    SELECT COALESCE(SUM(oi.subtotal), 0) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('approved', 'delivered')
      AND o.deleted_at IS NULL
      ${branchFilter}
  `, branchParams);
  const totalRevenue = Number(revenueRes.rows[0].revenue);

  // Monthly revenue
  const monthlyRes = await pool.query(`
    SELECT COALESCE(SUM(oi.subtotal), 0) as monthly
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('approved', 'delivered')
      AND o.deleted_at IS NULL
      AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      ${branchFilter}
  `, branchParams);
  const monthlyRevenue = Number(monthlyRes.rows[0].monthly);

  // Active workers
  const workersRes = await pool.query(
    `SELECT COUNT(*) as count FROM workers w WHERE w.deleted_at IS NULL AND w.is_active = true ${branchFilter.replace('o.branch_id', 'w.branch_id')}`,
    branchParams
  );
  const totalWorkers = parseInt(workersRes.rows[0].count);

  // Pending orders
  const pendingRes = await pool.query(
    `SELECT COUNT(*) as count FROM orders o WHERE o.status = 'pending' AND o.deleted_at IS NULL ${branchFilter}`,
    branchParams
  );
  const pendingOrders = parseInt(pendingRes.rows[0].count);

  // Low stock products
  const lowStockRes = await pool.query(
    `SELECT COUNT(*) as count FROM products p WHERE p.stock_quantity <= p.reorder_level AND p.stock_quantity > 0 AND p.deleted_at IS NULL ${branchFilter.replace('o.branch_id', 'p.branch_id')}`,
    branchParams
  );
  const lowStockCount = parseInt(lowStockRes.rows[0].count);

  res.status(200).json({
    totalOrders,
    totalRevenue,
    revenue: totalRevenue,
    monthlyRevenue,
    totalWorkers,
    pendingOrders,
    lowStockCount,
  });
}