import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

function getTable(type: string): string {
  switch (type) {
    case 'ticket': return 'support_tickets';
    case 'message': return 'contact_messages';
    case 'worker': return 'workers';
    case 'attendance': return 'attendance';
    case 'product': return 'products';
    case 'order': return 'orders';
    default: throw new Error('Invalid type');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user || !(await hasPermission(user.userId, 'recycle:view'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET – list all deleted items
  if (req.method === 'GET') {
    try {
      const workerNameCol = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'workers' AND column_name IN ('name', 'full_name')
      `);
      const workerName = workerNameCol.rows[0]?.column_name || 'name';

      const tickets = await pool.query(`
        SELECT id, ticket_number as name, 'ticket' as type, deleted_at, deleted_by
        FROM support_tickets WHERE deleted_at IS NOT NULL
      `);
      const messages = await pool.query(`
        SELECT id, name, 'message' as type, deleted_at, deleted_by
        FROM contact_messages WHERE deleted_at IS NOT NULL
      `);
      const workers = await pool.query(`
        SELECT id, ${workerName} as name, 'worker' as type, deleted_at, deleted_by
        FROM workers WHERE deleted_at IS NOT NULL
      `);
      const attendance = await pool.query(`
        SELECT id, date::text as name, 'attendance' as type, deleted_at, deleted_by
        FROM attendance WHERE deleted_at IS NOT NULL
      `);
      const products = await pool.query(`
        SELECT id, name, 'product' as type, deleted_at, deleted_by
        FROM products WHERE deleted_at IS NOT NULL
      `);
      let orders;
      try {
        orders = await pool.query(`
          SELECT id, COALESCE(order_number, id::text) as name, 'order' as type, deleted_at, deleted_by
          FROM orders WHERE deleted_at IS NOT NULL
        `);
      } catch {
        orders = await pool.query(`
          SELECT id, id::text as name, 'order' as type, deleted_at, deleted_by
          FROM orders WHERE deleted_at IS NOT NULL
        `);
      }
      const all = [
        ...tickets.rows,
        ...messages.rows,
        ...workers.rows,
        ...attendance.rows,
        ...products.rows,
        ...orders.rows,
      ];
      return res.status(200).json(all);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST – restore (single or bulk)
  if (req.method === 'POST') {
    const { action, items } = req.body; // items: [{ type, id }]
    if (action === 'bulk-restore' && Array.isArray(items)) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of items) {
          const table = getTable(item.type);
          await client.query(`UPDATE ${table} SET deleted_at = NULL, deleted_by = NULL WHERE id = $1`, [item.id]);
        }
        await client.query('COMMIT');
        return res.status(200).json({ success: true, restored: items.length });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Bulk restore failed' });
      } finally {
        client.release();
      }
    }
    // Single restore (existing endpoint)
    if (req.query.action === 'restore') {
      const { type, id } = req.query;
      const table = getTable(type as string);
      await pool.query(`UPDATE ${table} SET deleted_at = NULL, deleted_by = NULL WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid request' });
  }

  // DELETE – permanent delete (single or bulk)
  if (req.method === 'DELETE') {
    const { action, items } = req.body;
    if (action === 'bulk-permanent' && Array.isArray(items)) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of items) {
          const table = getTable(item.type);
          await client.query(`DELETE FROM ${table} WHERE id = $1`, [item.id]);
        }
        await client.query('COMMIT');
        return res.status(200).json({ success: true, deleted: items.length });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Bulk permanent delete failed' });
      } finally {
        client.release();
      }
    }
    // Single permanent delete
    if (req.query.action === 'permanent') {
      const { type, id } = req.query;
      const table = getTable(type as string);
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid request' });
  }

  res.status(405).end();
}