// src/pages/api/orders/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let user: any = null;

  // Try token verification safely for public requests
  try {
    user = verifyToken(req);
  } catch (error) {
    user = null;
  }

  // =========================================================
  // GET ORDERS
  // =========================================================

  if (req.method === 'GET') {
    try {
      if (!user || !(await hasPermission(user.userId, 'order:view'))) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      const { whereClause, params } = enforceBranchIsolation(
        user,
        'o',
        'branch_id'
      );

      let query = `
        SELECT
          o.*,
          b.name AS branch_name,

          (
            SELECT COUNT(*)
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) AS product_count,

          (
            SELECT string_agg(p.name, ', ')
            FROM order_items oi
            JOIN products p
              ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ) AS product_names

        FROM orders o

        LEFT JOIN branches b
          ON o.branch_id = b.id

        WHERE o.deleted_at IS NULL
        ${whereClause}
      `;

      const queryParams: any[] = [...params];
      let idx = queryParams.length + 1;

      const {
        status,
        payment,
        branch,
        search,
        startDate,
        endDate,
      } = req.query;

      // ---------------- STATUS FILTER ----------------

      if (status && status !== 'all') {
        query += ` AND o.status = $${idx++}`;
        queryParams.push(status);
      }

      // ---------------- PAYMENT FILTER ----------------

      if (payment && payment !== 'all') {
        query += ` AND o.payment_status = $${idx++}`;
        queryParams.push(payment);
      }

      // ---------------- BRANCH FILTER ----------------

      if (branch && branch !== 'all') {
        if (user.role === 'superadmin') {
          query += ` AND o.branch_id = $${idx++}`;
          queryParams.push(branch);
        }
      }

      // ---------------- SEARCH ----------------

      if (search) {
        query += `
          AND (
            o.order_number ILIKE $${idx}
            OR o.client_name ILIKE $${idx}
            OR o.client_phone ILIKE $${idx}
          )
        `;

        queryParams.push(`%${search}%`);
        idx++;
      }

      // ---------------- DATE FILTERS ----------------

      if (startDate) {
        query += ` AND o.created_at >= $${idx++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        query += ` AND o.created_at <= $${idx++}`;
        queryParams.push(endDate);
      }

      // ---------------- ORDER ----------------

      query += ` ORDER BY o.created_at DESC`;

      const result = await pool.query(query, queryParams);

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('GET ORDERS ERROR:', error);

      return res.status(500).json({
        error: 'Failed to fetch orders',
      });
    }
  }

  // =========================================================
  // CREATE ORDER
  // =========================================================

  if (req.method === 'POST') {
    try {
      const {
        client_name,
        client_phone,
        delivery_location,
        items,
        notes,
      } = req.body;

      // ---------------- VALIDATION ----------------

      if (!client_name) {
        return res.status(400).json({
          error: 'Client name is required',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Order items are required',
        });
      }

      // ---------------- ORDER NUMBER ----------------

      const orderNumber =
        'ORD-' +
        Date.now() +
        '-' +
        Math.floor(Math.random() * 1000);

      // ---------------- DETERMINE BRANCH ----------------

      let branchId: number | null = null;

      if (user) {
        if (user.role !== 'superadmin' && user.branchId) {
          branchId = user.branchId;
        } else if (
          user.role === 'superadmin' &&
          req.body.branch_id
        ) {
          branchId = req.body.branch_id;
        }
      } else {
        // Public website default branch
        branchId = 1;
      }

      // ---------------- CREATE ORDER ----------------

      const orderResult = await pool.query(
        `
        INSERT INTO orders
        (
          order_number,
          client_name,
          client_phone,
          delivery_location,
          branch_id,
          status,
          payment_status,
          notes,
          total_amount
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          'pending',
          'unpaid',
          $6,
          0
        )
        RETURNING *
        `,
        [
          orderNumber,
          client_name,
          client_phone,
          delivery_location,
          branchId,
          notes,
        ]
      );

      const order = orderResult.rows[0];
      const orderId = order.id;

      // ---------------- INSERT ORDER ITEMS ----------------

      let total = 0;

      for (const item of items) {
        const productRes = await pool.query(
          `
          SELECT id, price
          FROM products
          WHERE id = $1
          `,
          [item.product_id]
        );

        if (productRes.rows.length === 0) {
          return res.status(400).json({
            error: `Product ${item.product_id} not found`,
          });
        }

        const product = productRes.rows[0];

        const quantity = Number(item.quantity);
        const unitPrice = Number(product.price);

        const subtotal = quantity * unitPrice;

        total += subtotal;

        await pool.query(
          `
          INSERT INTO order_items
          (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          `,
          [
            orderId,
            item.product_id,
            quantity,
            unitPrice,
            subtotal,
          ]
        );
      }

      // ---------------- UPDATE TOTAL ----------------

      await pool.query(
        `
        UPDATE orders
        SET total_amount = $1
        WHERE id = $2
        `,
        [total, orderId]
      );

      // ---------------- AUDIT LOG ----------------

      if (user) {
        await logAudit({
          userId: user.userId,
          action: 'CREATE',
          targetType: 'order',
          targetId: orderId,
          newData: {
            orderNumber,
            client_name,
            total,
            branch_id: branchId,
          },
          ipAddress:
            (req.headers['x-forwarded-for'] as string) ||
            req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return res.status(201).json({
        success: true,
        order: {
          ...order,
          total_amount: total,
        },
      });
    } catch (error) {
      console.error('CREATE ORDER ERROR:', error);

      return res.status(500).json({
        error: 'Failed to create order',
      });
    }
  }

  // =========================================================
  // DELETE ORDER
  // =========================================================

  if (req.method === 'DELETE') {
    try {
      if (!user || !(await hasPermission(user.userId, 'order:delete'))) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'Order ID required',
        });
      }

      await pool.query(
        `
        UPDATE orders
        SET
          deleted_at = NOW(),
          deleted_by = $1
        WHERE id = $2
        `,
        [user.userId, id]
      );

      await logAudit({
        userId: user.userId,
        action: 'DELETE',
        targetType: 'order',
        targetId: Number(id),
        ipAddress:
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error('DELETE ORDER ERROR:', error);

      return res.status(500).json({
        error: 'Failed to delete order',
      });
    }
  }

  // =========================================================
  // METHOD NOT ALLOWED
  // =========================================================

  return res.status(405).json({
    error: 'Method not allowed',
  });
}