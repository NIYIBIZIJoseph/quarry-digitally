import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'department:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await pool.query('SELECT id, name FROM departments WHERE deleted_at IS NULL ORDER BY name');
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'department:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const result = await pool.query(`INSERT INTO departments (name) VALUES ($1) RETURNING id`, [name]);
    await logAudit({
      userId: user.userId,
      action: 'CREATE_DEPARTMENT',
      targetType: 'department',
      targetId: result.rows[0].id,
      newData: { name },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json({ id: result.rows[0].id, name });
  }

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'department:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID and name required' });
    await pool.query(`UPDATE departments SET name = $1 WHERE id = $2`, [name, id]);
    await logAudit({
      userId: user.userId,
      action: 'UPDATE_DEPARTMENT',
      targetType: 'department',
      targetId: id,
      newData: { name },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'department:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    // Check if any workers use this department
    const usage = await pool.query('SELECT COUNT(*) FROM workers WHERE department_id = $1', [id]);
    if (parseInt(usage.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Cannot delete department with assigned workers' });
    }
    await pool.query(`UPDATE departments SET deleted_at = NOW() WHERE id = $1`, [id]);
    await logAudit({
      userId: user.userId,
      action: 'DELETE_DEPARTMENT',
      targetType: 'department',
      targetId: Number(id),
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}