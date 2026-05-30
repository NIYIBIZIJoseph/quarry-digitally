import type {
  NextApiRequest,
  NextApiResponse,
} from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    try {

      // =========================================
      // GET BRANCHES
      // =========================================
      if (req.method === 'GET') {

        const allowed =
          await hasPermission(
            user.userId,
            'branch:view'
          );

        if (!allowed) {
          return res.status(403).json({
            error: 'Forbidden',
          });
        }

        // ✅ FIXED: Removed created_at column
        const result =
          await pool.query(
            `
            SELECT
              id,
              name,
              location
            FROM branches
            WHERE deleted_at IS NULL
            ORDER BY name ASC
            `
          );

        return res.status(200).json(
          result.rows
        );
      }

      // =========================================
      // CREATE BRANCH
      // =========================================
      if (req.method === 'POST') {

        const allowed =
          await hasPermission(
            user.userId,
            'branch:create'
          );

        if (!allowed) {
          return res.status(403).json({
            error: 'Forbidden',
          });
        }

        const {
          name,
          location,
        } = req.body;

        if (!name) {
          return res.status(400).json({
            error:
              'Branch name required',
          });
        }

        const existing =
          await pool.query(
            `
            SELECT id
            FROM branches
            WHERE LOWER(name) = LOWER($1)
              AND deleted_at IS NULL
            `,
            [name]
          );

        if (
          existing.rows.length > 0
        ) {
          return res.status(409).json({
            error:
              'Branch already exists',
          });
        }

        const created =
          await pool.query(
            `
            INSERT INTO branches (
              name,
              location
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
              name,
              location || null,
            ]
          );

        await logAudit({
          userId: user.userId,
          action: 'CREATE_BRANCH',
          targetType: 'branch',
          targetId:
            created.rows[0].id,

          newData: {
            name,
            location,
          },

          ipAddress:
            (req.headers[
              'x-forwarded-for'
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers[
              'user-agent'
            ],
        });

        return res.status(201).json({
          success: true,
          branch:
            created.rows[0],
        });
      }

      // =========================================
      // METHOD NOT ALLOWED
      // =========================================
      return res.status(405).json({
        error: 'Method not allowed',
      });

    } catch (err: any) {

      console.error(
        'BRANCHES API ERROR:',
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          'Internal server error',
      });
    }
  }
);