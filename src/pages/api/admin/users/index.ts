import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // ========== GET ==========
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'user:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, role, search, branchId } = req.query;
    let query = `
      SELECT u.id, u.phone, u.full_name, u.role_id, r.name as role,
             u.status, u.created_at, u.suspended_until,
             u.branch_id, b.name as branch_name, u.force_password_reset
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    const params: any[] = [];
    let idx = 1;

    // Branch isolation (user.role comes from JWT)
    if (user.role !== 'superadmin') {
      query += ` AND (u.branch_id = $${idx} OR u.branch_id IS NULL)`;
      params.push(user.branchId ?? null);
      idx++;
    } else if (branchId && branchId !== 'all') {
      query += ` AND u.branch_id = $${idx}`;
      params.push(branchId);
      idx++;
    }

    if (status && status !== 'all') {
      query += ` AND u.status = $${idx++}`;
      params.push(status);
    }
    if (role && role !== 'all') {
      query += ` AND r.name = $${idx++}`;
      params.push(role);
    }
    if (search) {
      query += ` AND (u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  }

  // ========== POST ==========
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'user:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { phone, password, full_name, role, branch_id } = req.body;
    if (!phone || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve role name to role_id
    const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleRes.rows.length === 0) {
      return res.status(400).json({ error: `Role '${role}' does not exist` });
    }
    const roleId = roleRes.rows[0].id;

    let targetBranch: number | null = branch_id ? parseInt(branch_id) : null;
    if (user.role !== 'superadmin') {
      targetBranch = user.branchId ?? null;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (phone, password, full_name, role_id, branch_id, status, force_password_reset)
         VALUES ($1, $2, $3, $4, $5, 'active', true) RETURNING id, phone, full_name`,
        [phone, hashedPassword, full_name, roleId, targetBranch]
      );
      const newUser = result.rows[0];
      await logAudit({
        userId: user.userId,
        action: 'CREATE',
        targetType: 'user',
        targetId: newUser.id,
        newData: { phone, full_name, role, branch_id: targetBranch },
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      return res.status(201).json(newUser);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Phone number already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}