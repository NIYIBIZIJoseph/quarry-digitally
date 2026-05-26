import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'dashboard:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let branchFilter = '';
  let branchParams: any[] = [];
  if (user.roleId !== 1 && user.branchId) {
    branchFilter = ' AND o.branch_id = $1';
    branchParams = [user.branchId];
  }

  const query = `
    SELECT DATE(o.created_at) as date,
           COALESCE(SUM(oi.subtotal), 0) as total
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('approved', 'delivered')
      AND o.created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND o.deleted_at IS NULL
      ${branchFilter}
    GROUP BY DATE(o.created_at)
    ORDER BY date ASC
  `;
  const result = await pool.query(query, branchParams);

  // Fill missing days
  const today = new Date();
  const map: Record<string, number> = {};
  for (const row of result.rows) {
    const dateStr = row.date.toISOString().split('T')[0];
    map[dateStr] = Number(row.total);
  }
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    data.push({ date: key, total: map[key] || 0 });
  }
  res.status(200).json(data);
}