import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!(await hasPermission(user.userId, 'analytics:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params } = enforceBranchIsolation(user, 'a', 'branch_id');

  // Today's stats
  const todayStats = await pool.query(`
    SELECT 
      COUNT(DISTINCT w.id) as total_workers,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
      COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
      COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
      COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as on_leave
    FROM workers w
    LEFT JOIN attendance a ON a.worker_id = w.id AND a.date = CURRENT_DATE
    WHERE w.deleted_at IS NULL AND w.is_active = true
    ${whereClause.replace(/a\.branch_id/g, 'w.branch_id')}
  `, params);
  const today = todayStats.rows[0] || { total_workers: 0, present: 0, late: 0, absent: 0, on_leave: 0 };

  // Attendance trend last 7 days
  const attendanceTrend = await pool.query(`
    SELECT a.date,
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
           COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
           COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
    FROM attendance a
    WHERE a.date > CURRENT_DATE - INTERVAL '7 days'
      AND a.deleted_at IS NULL
      ${whereClause}
    GROUP BY a.date
    ORDER BY a.date ASC
  `, params);

  // Worker ranking
  const workerRanking = await pool.query(`
   SELECT w.full_name as name,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
       COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
       COUNT(*) as total_days

    FROM workers w
    LEFT JOIN attendance a ON a.worker_id = w.id AND a.date > NOW() - INTERVAL '30 days'
    WHERE w.deleted_at IS NULL AND w.is_active = true
    ${whereClause.replace(/a\.branch_id/g, 'w.branch_id')}
    GROUP BY w.id, w.full_name
    ORDER BY present_days DESC
    LIMIT 10
  `, params);

  res.status(200).json({
    todayStats: today,
    attendanceTrend: attendanceTrend.rows,
    workerRanking: workerRanking.rows,
  });
}