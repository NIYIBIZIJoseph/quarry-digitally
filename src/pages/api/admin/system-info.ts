import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import os from 'os';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user || !(await hasPermission(user.userId, 'admin:controls'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const dbVersionRes = await pool.query('SELECT version()');
    const dbVersion = dbVersionRes.rows[0].version;
    const info = {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      dbVersion,
      environment: process.env.NODE_ENV || 'development',
    };
    res.status(200).json(info);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}