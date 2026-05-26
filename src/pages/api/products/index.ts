import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // ========== GET ==========
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'product:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { whereClause, params } = enforceBranchIsolation(user, 'p', 'branch_id');
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL ${whereClause}
      ORDER BY p.name ASC
    `;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows); // ✅ returns a plain array
  }

  // ========== POST ==========
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'product:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, category_id, price, stock_quantity, description, image_url, reorder_level, is_active } = req.body;
    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    let branchId = user.branchId;
    if (user.role === 'superadmin' && req.body.branch_id) {
      branchId = req.body.branch_id;
    }
    if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

    const result = await pool.query(
      `INSERT INTO products (name, category_id, price, stock_quantity, description, image_url, reorder_level, is_active, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, category_id, price || 0, stock_quantity || 0, description || '', image_url || '', reorder_level || 20, is_active !== false, branchId]
    );
    return res.status(201).json(result.rows[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}