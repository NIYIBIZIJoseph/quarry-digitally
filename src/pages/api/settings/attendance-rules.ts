import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'settings:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let branchId = user.branchId;
    if (user.roleId === 1 && req.query.branch_id) {
      branchId = parseInt(req.query.branch_id as string);
    }
    const result = await pool.query(
      'SELECT key, value, description FROM branch_settings WHERE branch_id = $1',
      [branchId]
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'settings:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value required' });
    }
    let branchId = user.branchId;
    if (user.roleId === 1 && req.body.branch_id) {
      branchId = req.body.branch_id;
    }
    await pool.query(
      `INSERT INTO branch_settings (branch_id, key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (branch_id, key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at`,
      [branchId, key, value, user.userId]
    );
    await logAudit({
      userId: user.userId,
      action: 'UPDATE_ATTENDANCE_RULE',
      targetType: 'branch_setting',
      targetId: undefined,
      newData: { branchId, key, value },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}