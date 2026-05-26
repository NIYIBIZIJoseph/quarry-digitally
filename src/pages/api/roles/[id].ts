import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;
  const roleId = parseInt(id as string);
  if (isNaN(roleId)) return res.status(400).json({ error: 'Invalid role ID' });

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'roles:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds array required' });
    }
    // Fetch old permissions for audit
    const oldPerms = await pool.query('SELECT permission_id FROM role_permissions WHERE role_id = $1', [roleId]);
    const oldIds = oldPerms.rows.map(r => r.permission_id);
    // Replace permissions
    await pool.query('BEGIN');
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    for (const permId of permissionIds) {
      await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, permId]);
    }
    await pool.query('COMMIT');
    await logAudit({
      userId: user.userId,
      action: 'UPDATE_ROLE_PERMISSIONS',
      targetType: 'role',
      targetId: roleId,
      oldData: { permissionIds: oldIds },
      newData: { permissionIds },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'roles:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Check if any user has this role
    const usersRes = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [roleId]);
    if (parseInt(usersRes.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Cannot delete role with assigned users' });
    }
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
    await logAudit({
      userId: user.userId,
      action: 'DELETE_ROLE',
      targetType: 'role',
      targetId: roleId,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}