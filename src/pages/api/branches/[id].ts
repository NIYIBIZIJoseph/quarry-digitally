import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;
  const branchId = parseInt(id as string);
  if (isNaN(branchId)) return res.status(400).json({ error: 'Invalid branch ID' });

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'branch:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    await pool.query(`UPDATE branches SET name = $1, location = $2 WHERE id = $3`, [name, location || null, branchId]);
    await logAudit({
      userId: user.userId,
      action: 'UPDATE_BRANCH',
      targetType: 'branch',
      targetId: branchId,
      newData: { name, location },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'branch:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Check if any users/orders/workers reference this branch
    const usage = await pool.query(
      `SELECT (SELECT COUNT(*) FROM users WHERE branch_id = $1) +
               (SELECT COUNT(*) FROM orders WHERE branch_id = $1) +
               (SELECT COUNT(*) FROM workers WHERE branch_id = $1) as total`,
      [branchId]
    );
    if (parseInt(usage.rows[0].total) > 0) {
      return res.status(409).json({ error: 'Cannot delete branch with existing records' });
    }
    await pool.query(`UPDATE branches SET deleted_at = NOW() WHERE id = $1`, [branchId]);
    await logAudit({
      userId: user.userId,
      action: 'DELETE_BRANCH',
      targetType: 'branch',
      targetId: branchId,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}