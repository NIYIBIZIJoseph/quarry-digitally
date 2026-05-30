import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fast-moving products (sold > 50 units in last 30 days)
    const fastMovingProducts = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.quantity), 0) as units_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('approved', 'delivered')
      WHERE p.deleted_at IS NULL
        AND (o.created_at > NOW() - INTERVAL '30 days' OR o.created_at IS NULL)
      GROUP BY p.id, p.name
      HAVING COALESCE(SUM(oi.quantity), 0) > 50
      ORDER BY units_sold DESC
      LIMIT 10
      `
    );

    // Slow-moving products (sold 1-50 units in last 30 days)
    const slowMovingProducts = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.quantity), 0) as units_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('approved', 'delivered')
      WHERE p.deleted_at IS NULL
        AND (o.created_at > NOW() - INTERVAL '30 days' OR o.created_at IS NULL)
      GROUP BY p.id, p.name
      HAVING COALESCE(SUM(oi.quantity), 0) BETWEEN 1 AND 50
      ORDER BY units_sold DESC
      LIMIT 10
      `
    );

    // Dead stock (no sales in last 90 days, stock > 0)
    const deadStockProducts = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.stock_quantity
      FROM products p
      WHERE p.deleted_at IS NULL
        AND p.stock_quantity > 0
        AND NOT EXISTS (
          SELECT 1 FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at > NOW() - INTERVAL '90 days'
        )
      LIMIT 10
      `
    );

    // Turnover rate (total sold / total stock)
    const turnoverRate = await pool.query(
      `
      SELECT 
        COALESCE(SUM(oi.quantity), 0)::float / NULLIF(SUM(p.stock_quantity), 0) as turnover_rate
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('approved', 'delivered')
      WHERE p.deleted_at IS NULL
        AND o.created_at > NOW() - INTERVAL '30 days'
      `
    );

    // Product sales for chart
    const productSales = await pool.query(
      `
      SELECT 
        p.name,
        COALESCE(SUM(oi.quantity), 0) as sold_units
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('approved', 'delivered')
      WHERE p.deleted_at IS NULL
        AND (o.created_at > NOW() - INTERVAL '30 days' OR o.created_at IS NULL)
      GROUP BY p.id, p.name
      ORDER BY sold_units DESC
      LIMIT 10
      `
    );

    return res.status(200).json({
      fastMoving: fastMovingProducts.rows.length,
      slowMoving: slowMovingProducts.rows.length,
      deadStock: deadStockProducts.rows.length,
      turnoverRate: turnoverRate.rows[0]?.turnover_rate || 0,
      fastMovingProducts: fastMovingProducts.rows,
      slowMovingProducts: slowMovingProducts.rows,
      deadStockProducts: deadStockProducts.rows,
      productSales: productSales.rows
    });

  } catch (error) {
    console.error("Inventory analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch inventory analytics" });
  }
});