import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'roles:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const roles = await pool.query('SELECT id, name FROM roles ORDER BY id');
    const permissions = await pool.query('SELECT id, name FROM permissions ORDER BY name');
    const rolePerms = await pool.query('SELECT role_id, permission_id FROM role_permissions');
    const data = roles.rows.map(role => ({
      ...role,
      permissions: permissions.rows.filter(p => rolePerms.rows.some(rp => rp.role_id === role.id && rp.permission_id === p.id)).map(p => p.name),
    }));
    return res.status(200).json(data);
  }

  res.status(405).end();
}