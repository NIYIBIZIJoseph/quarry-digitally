import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Worker ID required' });
  }

  // ================= GET SINGLE WORKER =================
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `
        SELECT
          w.*,
          d.name AS department_name,
          b.name AS branch_name
        FROM workers w
        LEFT JOIN departments d
          ON w.department_id = d.id
        LEFT JOIN branches b
          ON w.branch_id = b.id
        WHERE w.id = $1
        LIMIT 1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch worker' });
    }
  }

  // ================= UPDATE WORKER =================
  if (req.method === 'PUT') {
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
        is_active,
      } = req.body;

      const existing = await pool.query(
        `SELECT * FROM workers WHERE id = $1`,
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      const oldData = existing.rows[0];

      const updated = await pool.query(
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
          is_active = $9
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

      await logAudit({
        userId: user.userId,
        action: 'UPDATE',
        targetType: 'worker',
        targetId: Number(id),
        oldData,
        newData: updated.rows[0],
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json(updated.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update worker' });
    }
  }

  // ================= DELETE WORKER =================
  if (req.method === 'DELETE') {
    try {
      await pool.query(
        `
        UPDATE workers
        SET is_active = false
        WHERE id = $1
        `,
        [id]
      );

      return res.status(200).json({
        success: true,
        message: 'Worker deactivated',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to deactivate worker' });
    }
  }

  return res.status(405).json({
    error: 'Method not allowed',
  });
}