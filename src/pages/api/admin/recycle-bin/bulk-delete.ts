import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user || !(await hasPermission(user.userId, 'recycle:view'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let deletedCount = 0;
    for (const item of items) {
      const { type, id } = item;
      if (!type || !id) continue;
      const table = getTable(type);
      const result = await client.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
      // ✅ Fix: rowCount can be null, default to 0
      const rowsDeleted = result.rowCount ?? 0;
      if (rowsDeleted > 0) {
        deletedCount++;
        await logAudit({
          userId: user.userId,
          action: 'BULK_PERMANENT_DELETE',
          targetType: type,
          targetId: id,
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });
      }
    }
    await client.query('COMMIT');
    res.status(200).json({ success: true, deleted: deletedCount });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}