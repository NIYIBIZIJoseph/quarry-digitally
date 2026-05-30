import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { enforceBranchIsolation } from "@/lib/branch";
import { createNotificationForAllAdmins } from "@/lib/notifications";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET ORDERS =================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "order:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { whereClause, params } = enforceBranchIsolation(user, "o", "branch_id");

    // ✅ FIXED: Added product names and product count
    const result = await pool.query(
      `
      SELECT 
        o.*, 
        b.name AS branch_name,
        COALESCE(
          (SELECT STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name)
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = o.id),
          ''
        ) AS product_names,
        COALESCE(
          (SELECT COUNT(*)
           FROM order_items oi
           WHERE oi.order_id = o.id),
          0
        ) AS product_count
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.deleted_at IS NULL
      ${whereClause}
      ORDER BY o.created_at DESC
      `,
      params
    );

    return res.status(200).json(result.rows);
  }

  // ================= CREATE ORDER =================
  if (req.method === "POST") {

    const allowed = await hasPermission(user.userId, "order:create");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { client_name, client_phone, items = [], delivery_location, note, total_amount } = req.body;

    if (!client_name) {
      return res.status(400).json({ error: "Client name required" });
    }

    const orderNumber = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    
    let branchId = user.branchId;
    if (user.role === ROLES.SUPERADMIN && req.body.branch_id) {
      branchId = req.body.branch_id;
    }

    const orderResult = await pool.query(
      `
      INSERT INTO orders (
        order_number, 
        client_name, 
        client_phone, 
        status, 
        branch_id,
        delivery_location,
        note,
        total_amount,
        payment_status
      )
      VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, 'unpaid')
      RETURNING *
      `,
      [orderNumber, client_name, client_phone || null, branchId || null, delivery_location || null, note || null, total_amount || 0]
    );

    const order = orderResult.rows[0];

    // Insert order items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await pool.query(
          `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [order.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    await createNotificationForAllAdmins(
      "New Order Created",
      `Order ${orderNumber} created by ${client_name}`,
      "order",
      "medium",
      `/dashboard/orders/${order.id}`
    );

    await logAudit({
      userId: user.userId,
      action: "CREATE",
      targetType: "order",
      targetId: order.id,
      newData: order,
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({ success: true, order });
  }

  // ================= UPDATE ORDER STATUS =================
  if (req.method === "PUT") {

    const allowed = await hasPermission(user.userId, "order:edit");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { id, status, payment_status } = req.body;

    if (!id) return res.status(400).json({ error: "Order ID required" });

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (payment_status) {
      updates.push(`payment_status = $${idx++}`);
      values.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);

    const result = await pool.query(
      `
      UPDATE orders
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
      `,
      values
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      targetType: "order",
      targetId: id,
      newData: result.rows[0],
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true, order: result.rows[0] });
  }

  // ================= DELETE ORDER =================
  if (req.method === "DELETE") {

    const allowed = await hasPermission(user.userId, "order:delete");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "Order ID required" });

    await pool.query(
      `
      UPDATE orders
      SET deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, id]
    );

    await logAudit({
      userId: user.userId,
      action: "DELETE",
      targetType: "order",
      targetId: Number(id),
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
});