import jwt from 'jsonwebtoken';
import type { NextApiRequest } from 'next';
import pool from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

export interface AuthUser {
  userId: number;
  phone: string;
  role: string;           // role name from 'roles' table
  branchId: number | null;
  forceReset?: boolean;
}

export function verifyToken(req: NextApiRequest): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function hasPermission(userId: number, requiredPermission: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM users u
         JOIN role_permissions rp ON u.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE u.id = $1 AND p.name = $2 AND u.deleted_at IS NULL
       )`,
      [userId, requiredPermission]
    );
    return res.rows[0].exists;
  } finally {
    client.release();
  }
}

export function hasRole(user: AuthUser | null, roles: string[]) {
  return user && roles.includes(user.role);
}