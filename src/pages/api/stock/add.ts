import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'inventory:adjust'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { product_id, quantity, reason } = req.body;
  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  // Branch parameters first, then product_id
  const { whereClause, params: branchParams } = enforceBranchIsolation(user, 'p', 'branch_id');
  const checkQuery = `
    SELECT id, stock_quantity FROM products p
    WHERE id = $${branchParams.length + 1}
    ${whereClause}
  `;
  const checkParams = [...branchParams, product_id];
  const checkRes = await pool.query(checkQuery, checkParams);
  if (checkRes.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found or not in your branch' });
  }
  const product = checkRes.rows[0];
  const oldStock = product.stock_quantity;
  const newStock = oldStock + quantity;

  // Update product stock
  await pool.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, product_id]);

  // Log movement (ensure table exists, else create it)
  const branchId = branchParams.length > 0 ? branchParams[0] : 1;
  await pool.query(
    `INSERT INTO stock_movements (product_id, branch_id, quantity_change, new_quantity, reason, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [product_id, branchId, quantity, newStock, reason || 'Manual restock', user.userId]
  );

  return res.status(200).json({ message: 'Stock added successfully' });
}