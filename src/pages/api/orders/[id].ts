import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;
  const orderId = parseInt(id as string);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  // ================= GET ORDER DETAILS =================
  if (req.method === "GET") {
    const allowed = await hasPermission(user.userId, "order:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const result = await pool.query(
      `
      SELECT 
        o.*, 
        b.name AS branch_name,
        COALESCE(
          (SELECT JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', p.id,
               'name', p.name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'subtotal', oi.subtotal
             )
           )
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = o.id),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.id = $1 AND o.deleted_at IS NULL
      `,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json(result.rows[0]);
  }

  // ================= UPDATE ORDER =================
  if (req.method === "PUT") {
    const allowed = await hasPermission(user.userId, "order:edit");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { status, payment_status, admin_notes } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (payment_status !== undefined) {
      updates.push(`payment_status = $${idx++}`);
      values.push(payment_status);
    }
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${idx++}`);
      values.push(admin_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(orderId);

    // ✅ FIXED: Removed updated_at column (doesn't exist in your table)
    const result = await pool.query(
      `
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING *
      `,
      values
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      targetType: "order",
      targetId: orderId,
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

    await pool.query(
      `
      UPDATE orders
      SET deleted_at = NOW(), deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, orderId]
    );

    await logAudit({
      userId: user.userId,
      action: "DELETE",
      targetType: "order",
      targetId: orderId,
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
});