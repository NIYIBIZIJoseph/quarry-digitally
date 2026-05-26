import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const result = await pool.query('SELECT key, value, description FROM system_settings ORDER BY key');
    return res.status(200).json(result.rows);
  }

  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'settings:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });
    await pool.query(
      `UPDATE system_settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3`,
      [value, user.userId, key]
    );
    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'system_setting',
      targetId: undefined, // ✅ changed from null to undefined
      newData: { key, value },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}