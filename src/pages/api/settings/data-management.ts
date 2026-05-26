import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'settings:edit'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { action, table, days, confirm } = req.body;

  if (req.method === 'POST') {
    switch (action) {
      case 'backup':
        // Placeholder – in production you would call pg_dump or a backup service
        await logAudit({
          userId: user.userId,
          action: 'BACKUP_DATABASE',
          targetType: 'system',
          targetId: undefined,
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });
        return res.status(200).json({ success: true, message: 'Backup initiated (placeholder).' });

      case 'export':
        if (!table) return res.status(400).json({ error: 'Table name required' });
        const allowedTables = ['orders', 'users', 'workers', 'attendance', 'products', 'support_tickets'];
        if (!allowedTables.includes(table)) {
          return res.status(400).json({ error: 'Invalid table name' });
        }
        const result = await pool.query(`SELECT * FROM ${table} WHERE deleted_at IS NULL ORDER BY id`);
        return res.status(200).json({ success: true, data: result.rows, table });

      case 'purge':
        if (!table || !days) return res.status(400).json({ error: 'Table and days required' });
        if (!confirm) return res.status(400).json({ error: 'Confirmation required' });
        const purgeRes = await pool.query(
          `DELETE FROM ${table} WHERE created_at < NOW() - INTERVAL '${days} days' AND deleted_at IS NULL`
        );
        await logAudit({
          userId: user.userId,
          action: 'PURGE_RECORDS',
          targetType: table,
          targetId: undefined,
          newData: { days, count: purgeRes.rowCount },
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });
        return res.status(200).json({ success: true, count: purgeRes.rowCount });

      case 'cleanup_soft':
        if (!table || !days) return res.status(400).json({ error: 'Table and days required' });
        const cleanupRes = await pool.query(
          `DELETE FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '${days} days'`
        );
        await logAudit({
          userId: user.userId,
          action: 'CLEANUP_SOFT_DELETED',
          targetType: table,
          targetId: undefined,
          newData: { days, count: cleanupRes.rowCount },
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });
        return res.status(200).json({ success: true, count: cleanupRes.rowCount });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  }

  res.status(405).end();
}