import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const userId = parseInt(id as string);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  // Fetch existing user (for branch check and audit)
  const existingRes = await pool.query(
    `SELECT u.*, r.name as role_name FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );
  if (existingRes.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  const existing = existingRes.rows[0];

  // Branch isolation: non‑superadmin cannot manage users from another branch
  if (user.role !== 'superadmin' && existing.branch_id !== (user.branchId ?? null)) {
    return res.status(403).json({ error: 'Cannot manage user from another branch' });
  }

  // ========== PUT ==========
  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'user:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, role, branch_id, force_password_reset, suspended_until } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (role !== undefined) {
      let roleId: number | null = null;
      if (role) {
        const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
        if (roleRes.rows.length === 0) {
          return res.status(400).json({ error: `Role '${role}' does not exist` });
        }
        roleId = roleRes.rows[0].id;
      }
      updates.push(`role_id = $${idx++}`);
      values.push(roleId);
    }
    if (branch_id !== undefined) {
      if (user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only superadmin can change branch' });
      }
      updates.push(`branch_id = $${idx++}`);
      values.push(branch_id ? parseInt(branch_id) : null);
    }
    if (force_password_reset !== undefined) {
      updates.push(`force_password_reset = $${idx++}`);
      values.push(force_password_reset);
    }
    if (suspended_until !== undefined) {
      updates.push(`suspended_until = $${idx++}`);
      values.push(suspended_until || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, phone, full_name, role_id, branch_id, status, force_password_reset`;
    const result = await pool.query(updateQuery, values);
    const updated = result.rows[0];

    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'user',
      targetId: userId,
      oldData: existing,
      newData: updated,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true, user: updated });
  }

  // ========== DELETE ==========
  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'user:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('UPDATE users SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2', [user.userId, userId]);
    await logAudit({
      userId: user.userId,
      action: 'DELETE',
      targetType: 'user',
      targetId: userId,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}