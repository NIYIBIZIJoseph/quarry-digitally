import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'settings:edit'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { table, days } = req.body;
  if (!table || !days) return res.status(400).json({ error: 'Table name and days required' });
  const allowedTables = ['orders', 'users', 'workers', 'attendance', 'products', 'support_tickets', 'contact_messages'];
  if (!allowedTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });
  const result = await pool.query(
    `DELETE FROM ${table} WHERE deleted_at < NOW() - INTERVAL '1 day' * $1 AND deleted_at IS NOT NULL RETURNING id`,
    [days]
  );
  const deletedCount = result.rowCount;
  await logAudit({
    userId: user.userId,
    action: 'CLEANUP_SOFT_DELETED',
    targetType: table,
    targetId: undefined,
    newData: { table, days, deletedCount },
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });
  res.status(200).json({ success: true, deleted: deletedCount });
}