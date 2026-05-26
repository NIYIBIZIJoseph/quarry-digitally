import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'roles:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Fetch roles with their permissions
    const rolesRes = await pool.query('SELECT id, name FROM roles ORDER BY id');
    const roles = rolesRes.rows;
    const permsRes = await pool.query('SELECT id, name FROM permissions ORDER BY name');
    const allPermissions = permsRes.rows;
    const rolePermsRes = await pool.query('SELECT role_id, permission_id FROM role_permissions');
    const rolePerms = rolePermsRes.rows;

    const rolesWithPerms = roles.map(role => ({
      ...role,
      permissions: rolePerms.filter(rp => rp.role_id === role.id).map(rp => rp.permission_id),
    }));

    return res.status(200).json({ roles: rolesWithPerms, allPermissions });
  }

  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'roles:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name required' });
    // Check duplicate
    const existing = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Role already exists' });
    }
    const result = await pool.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', [name]);
    const roleId = result.rows[0].id;
    await logAudit({
      userId: user.userId,
      action: 'CREATE_ROLE',
      targetType: 'role',
      targetId: roleId,
      newData: { name },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json({ id: roleId, name });
  }

  res.status(405).end();
}