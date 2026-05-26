import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const productId = parseInt(id as string);
  if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID' });

  // Branch isolation for single product
  const { whereClause, params } = enforceBranchIsolation(user, 'p', 'branch_id');
  const productRes = await pool.query(
    `SELECT p.*, b.name as branch_name FROM products p
     LEFT JOIN branches b ON p.branch_id = b.id
     WHERE p.id = $${params.length + 1} AND p.deleted_at IS NULL ${whereClause}`,
    [...params, productId]
  );
  if (productRes.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found or access denied' });
  }
  const product = productRes.rows[0];

  // ========== GET ==========
  if (req.method === 'GET') {
    if (!await hasPermission(user.userId, 'product:view')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json(product);
  }

  // ========== PUT ==========
  if (req.method === 'PUT') {
    if (!await hasPermission(user.userId, 'product:edit')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, description, price, category_id, image_url, stock_quantity, branch_id } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined) { updates.push(`price = $${idx++}`); values.push(price); }
    if (category_id !== undefined) { updates.push(`category_id = $${idx++}`); values.push(category_id); }
    if (image_url !== undefined) { updates.push(`image_url = $${idx++}`); values.push(image_url); }
    if (stock_quantity !== undefined) { updates.push(`stock_quantity = $${idx++}`); values.push(stock_quantity); }
    if (branch_id !== undefined) {
      if (user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only superadmin can change branch' });
      }
      updates.push(`branch_id = $${idx++}`);
      values.push(branch_id);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(productId);
    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    const updated = result.rows[0];
    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'product',
      targetId: productId,
      oldData: product,
      newData: updated,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json(updated);
  }

  // ========== DELETE ==========
  if (req.method === 'DELETE') {
    if (!await hasPermission(user.userId, 'product:delete')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('UPDATE products SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2', [user.userId, productId]);
    await logAudit({
      userId: user.userId,
      action: 'DELETE',
      targetType: 'product',
      targetId: productId,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}