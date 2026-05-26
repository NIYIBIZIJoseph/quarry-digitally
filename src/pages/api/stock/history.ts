import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'inventory:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { product_id, limit = 50 } = req.query;
  const { whereClause, params } = enforceBranchIsolation(user, 'sm', 'branch_id');

  let query = `
    SELECT sm.*, p.name as product_name, u.full_name as user_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.user_id = u.id
    WHERE 1=1 ${whereClause}
  `;
  const queryParams = [...params];
  let idx = queryParams.length + 1;

  if (product_id) {
    query += ` AND sm.product_id = $${idx++}`;
    queryParams.push(product_id);
  }
  query += ` ORDER BY sm.created_at DESC LIMIT $${idx++}`;
  queryParams.push(limit);

  const result = await pool.query(query, queryParams);
  return res.status(200).json(result.rows);
}