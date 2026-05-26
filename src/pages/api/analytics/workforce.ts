import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!(await hasPermission(user.userId, 'analytics:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params } = enforceBranchIsolation(user, 'w', 'branch_id');

  // Top 5 most reliable workers (present days)
  const topReliable = await pool.query(`
    SELECT w.full_name, COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present
    FROM workers w
    LEFT JOIN attendance a ON a.worker_id = w.id AND a.date > NOW() - INTERVAL '30 days'
    WHERE w.deleted_at IS NULL AND w.is_active = true
      ${whereClause}
    GROUP BY w.id, w.full_name
    ORDER BY present DESC
    LIMIT 5
  `, params);

  // Most late arrivals
  const mostLate = await pool.query(`
    SELECT w.full_name, COUNT(*) as late_count
    FROM workers w
    JOIN attendance a ON a.worker_id = w.id
    WHERE a.status = 'late' AND a.date > NOW() - INTERVAL '30 days'
      AND w.deleted_at IS NULL
      ${whereClause}
    GROUP BY w.id, w.full_name
    ORDER BY late_count DESC
    LIMIT 5
  `, params);

  // Most absent workers
  const mostAbsent = await pool.query(`
    SELECT w.full_name, COUNT(*) as absent_count
    FROM workers w
    JOIN attendance a ON a.worker_id = w.id
    WHERE a.status = 'absent' AND a.date > NOW() - INTERVAL '30 days'
      AND w.deleted_at IS NULL
      ${whereClause}
    GROUP BY w.id, w.full_name
    ORDER BY absent_count DESC
    LIMIT 5
  `, params);

  res.status(200).json({ topReliable: topReliable.rows, mostLate: mostLate.rows, mostAbsent: mostAbsent.rows });
}