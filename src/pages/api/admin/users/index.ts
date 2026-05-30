import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  // ================= GET USERS =================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "user:view");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { status, role, search } = req.query;

    // ✅ FIXED: Added LEFT JOIN branches to get branch_name
    let query = `
      SELECT u.id, u.phone, u.full_name,
             r.name as role, u.status,
             u.created_at, u.branch_id,
             b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.deleted_at IS NULL
    `;

    const params: any[] = [];
    let i = 1;

    if (user.role !== ROLES.SUPERADMIN) {
      query += ` AND u.branch_id = $${i}`;
      params.push(user.branchId);
      i++;
    }

    if (status && status !== "all") {
      query += ` AND u.status = $${i++}`;
      params.push(status);
    }

    if (role && role !== "all") {
      query += ` AND r.name = $${i++}`;
      params.push(role);
    }

    if (search) {
      query += ` AND (u.full_name ILIKE $${i} OR u.phone ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  }

  // ================= CREATE USER =================
  if (req.method === "POST") {

    const allowed = await hasPermission(user.userId, "user:create");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { phone, password, full_name, role, branch_id } = req.body;

    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      [role]
    );

    if (!roleRes.rows.length) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (phone, password, full_name, role_id, branch_id, status, force_password_reset)
      VALUES ($1,$2,$3,$4,$5,'active',true)
      RETURNING id, phone, full_name
      `,
      [phone, hashed, full_name, roleRes.rows[0].id, branch_id ?? null]
    );

    await logAudit({
      userId: user.userId,
      action: "CREATE_USER",
      targetType: "user",
      targetId: result.rows[0].id,
      newData: { phone, full_name, role },
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json(result.rows[0]);
  }

  return res.status(405).json({ error: "Method not allowed" });
});