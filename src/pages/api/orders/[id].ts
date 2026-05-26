// src/pages/api/orders/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const orderId = parseInt(id as string);
  if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

  // Branch isolation check
  const { whereClause, params: branchParams } = enforceBranchIsolation(user, 'o', 'branch_id');
  const checkQuery = `
    SELECT o.* FROM orders o
    WHERE o.id = $${branchParams.length + 1}
      AND o.deleted_at IS NULL
      ${whereClause}
  `;
  const checkRes = await pool.query(checkQuery, [...branchParams, orderId]);
  if (checkRes.rows.length === 0) {
    return res.status(404).json({ error: 'Order not found or access denied' });
  }
  const existingOrder = checkRes.rows[0];

  // ========== GET ==========
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'order:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return res.status(200).json({ ...existingOrder, items: itemsRes.rows });
  }

  // ========== PUT (update status, payment, etc.) ==========
  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'order:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { status, payment_status, assigned_worker_id, notes, delivery_date } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (payment_status !== undefined) { updates.push(`payment_status = $${idx++}`); values.push(payment_status); }
    if (assigned_worker_id !== undefined) { updates.push(`assigned_worker_id = $${idx++}`); values.push(assigned_worker_id || null); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes); }
    if (delivery_date !== undefined) { updates.push(`delivery_date = $${idx++}`); values.push(delivery_date); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(orderId);
    await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    return res.status(200).json({ success: true, message: 'Order updated' });
  }

  // ========== DELETE (soft delete) ==========
  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'order:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query(`UPDATE orders SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2`, [user.userId, orderId]);
    return res.status(200).json({ success: true, message: 'Order deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}