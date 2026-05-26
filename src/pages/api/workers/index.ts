import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  // ================= GET =================

  if (req.method === 'GET') {
    const { whereClause, params } =
      enforceBranchIsolation(
        user,
        'w',
        'branch_id'
      );

    let query = `
      SELECT
        w.id,
        w.full_name,
        w.phone,
        w.email,
        w.department_id,
        w.salary,
        w.join_date,
        w.location,
        w.image_url,
        w.is_active,
        w.branch_id,
        b.name AS branch_name,
        d.name AS department_name
      FROM workers w
      LEFT JOIN branches b
        ON w.branch_id = b.id
      LEFT JOIN departments d
        ON w.department_id = d.id
      WHERE w.deleted_at IS NULL
      ${whereClause}
    `;

    const queryParams = [...params];

    let idx = queryParams.length + 1;

    const {
      search,
      department_id,
      is_active,
    } = req.query;

    if (search) {
      query += `
        AND (
          w.full_name ILIKE $${idx}
          OR w.phone ILIKE $${idx}
        )
      `;

      queryParams.push(`%${search}%`);

      idx++;
    }

    if (department_id) {
      query += `
        AND w.department_id = $${idx}
      `;

      queryParams.push(
        department_id as string
      );

      idx++;
    }

    if (is_active !== undefined) {
      query += `
        AND w.is_active = $${idx}
      `;

      queryParams.push(
        is_active === 'true'
      );

      idx++;
    }

    query += `
      ORDER BY w.full_name
    `;

    const result = await pool.query(
      query,
      queryParams
    );

    return res
      .status(200)
      .json(result.rows);
  }

  // ================= POST =================

  if (req.method === 'POST') {
    try {
      const {
        full_name,
        phone,
        email,
        department_id,
        salary,
        join_date,
        location,
        image_url,
        emergency_contact_name,
        emergency_contact_phone,
      } = req.body;

      if (!full_name) {
        return res.status(400).json({
          error: 'Full name required',
        });
      }

      let branchId = user.branchId;

      if (
        user.role === 'superadmin' &&
        req.body.branch_id
      ) {
        branchId = req.body.branch_id;
      }

      if (!branchId) {
        return res.status(400).json({
          error: 'Branch ID required',
        });
      }

      const result = await pool.query(
        `
        INSERT INTO workers (
          full_name,
          phone,
          email,
          department_id,
          salary,
          join_date,
          location,
          image_url,
          branch_id,
          is_active,
          emergency_contact_name,
          emergency_contact_phone
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,true,$10,$11
        )
        RETURNING *
        `,
        [
          full_name,
          phone || null,
          email || null,
          department_id || null,
          salary || null,
          join_date || null,
          location || null,
          image_url || null,
          branchId,
          emergency_contact_name || null,
          emergency_contact_phone || null,
        ]
      );

      const newWorker = result.rows[0];

      await logAudit({
        userId: user.userId,
        action: 'CREATE',
        targetType: 'worker',
        targetId: newWorker.id,
        newData: newWorker,
        ipAddress:
          req.headers[
            'x-forwarded-for'
          ] as string,
        userAgent:
          req.headers['user-agent'],
      });

      return res
        .status(201)
        .json(newWorker);
    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        error: err.message,
      });
    }
  }

  // ================= PUT =================

  if (req.method === 'PUT') {
    try {
      const {
        id,
        full_name,
        phone,
        email,
        department_id,
        salary,
        join_date,
        location,
        image_url,
        is_active,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'Worker ID required',
        });
      }

      const existing = await pool.query(
        `
        SELECT *
        FROM workers
        WHERE id = $1
        `,
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          error: 'Worker not found',
        });
      }

      const oldData = existing.rows[0];

      const result = await pool.query(
        `
        UPDATE workers
        SET
          full_name = $1,
          phone = $2,
          email = $3,
          department_id = $4,
          salary = $5,
          join_date = $6,
          location = $7,
          image_url = $8,
          is_active = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
        `,
        [
          full_name,
          phone || null,
          email || null,
          department_id || null,
          salary || null,
          join_date || null,
          location || null,
          image_url || null,
          is_active,
          id,
        ]
      );

      const updatedWorker =
        result.rows[0];

      await logAudit({
        userId: user.userId,
        action: 'UPDATE',
        targetType: 'worker',
        targetId: updatedWorker.id,
        oldData,
        newData: updatedWorker,
        ipAddress:
          req.headers[
            'x-forwarded-for'
          ] as string,
        userAgent:
          req.headers['user-agent'],
      });

      return res
        .status(200)
        .json(updatedWorker);
    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        error: err.message,
      });
    }
  }

  return res.status(405).json({
    error: 'Method not allowed',
  });
}