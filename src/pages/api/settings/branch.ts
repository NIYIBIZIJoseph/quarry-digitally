import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // branchId can be undefined (for superadmin when no branch_id in query)
  let branchId: number | undefined = undefined;
  if (user.roleId !== 1) {
    branchId = user.branchId; // user.branchId is number | undefined
  } else if (req.query.branch_id) {
    branchId = parseInt(req.query.branch_id as string);
  }

  if (req.method === 'GET') {
    // If branchId is undefined, the query will return all branches (for superadmin)
    const query = `
      SELECT bs.key, bs.value, bs.description, b.name as branch_name
      FROM branch_settings bs
      JOIN branches b ON bs.branch_id = b.id
      WHERE ($1::int IS NULL OR bs.branch_id = $1)
      ORDER BY bs.branch_id, bs.key
    `;
    const result = await pool.query(query, [branchId ?? null]); // convert undefined to null for SQL
    return res.status(200).json(result.rows);
  }

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'settings:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { branch_id, key, value } = req.body;
    if (!branch_id || !key) return res.status(400).json({ error: 'Branch ID and key required' });
    if (user.roleId !== 1 && user.branchId !== branch_id) {
      return res.status(403).json({ error: 'Cannot edit another branch' });
    }
    await pool.query(
      `INSERT INTO branch_settings (branch_id, key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (branch_id, key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`,
      [branch_id, key, value, user.userId]
    );
    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'branch_setting',
      targetId: undefined,
      newData: { branch_id, key, value },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}