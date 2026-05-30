import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { AuthUser } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { whereClause, params } = enforceBranchIsolation(user, 'o', 'branch_id');

    const result = await pool.query(`
      SELECT 
        o.status,
        COUNT(*) as count
      FROM orders o
      WHERE o.deleted_at IS NULL
        ${whereClause}
      GROUP BY o.status
      ORDER BY 
        CASE o.status
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'delivered' THEN 3
          WHEN 'cancelled' THEN 4
          ELSE 5
        END
    `, params);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Order status API error:', error);
    return res.status(500).json({ error: 'Failed to fetch order status' });
  }
});