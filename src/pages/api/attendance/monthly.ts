import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!await hasPermission(user.userId, 'attendance:view')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { year, month, department_id } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month required' });

  const startDate = `${year}-${month.toString().padStart(2,'0')}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const endDate = `${year}-${month.toString().padStart(2,'0')}-${lastDay}`;

  try {
    let query = `
      SELECT 
        w.id,
        w.full_name as name,
        d.name as department,
        COUNT(CASE WHEN a.check_in IS NOT NULL AND a.is_late = false THEN 1 END) as present,
        COUNT(CASE WHEN a.check_in IS NOT NULL AND a.is_late = true THEN 1 END) as late,
        COUNT(CASE WHEN a.check_in IS NULL AND l.id IS NULL THEN 1 END) as absent,
        COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) as leave
      FROM workers w
      LEFT JOIN departments d ON w.department_id = d.id
      LEFT JOIN attendance a ON a.worker_id = w.id AND a.date BETWEEN $1 AND $2
      LEFT JOIN leave_requests l ON l.worker_id = w.id AND l.status = 'approved' AND (l.start_date BETWEEN $1 AND $2 OR l.end_date BETWEEN $1 AND $2)
      WHERE w.is_active = true
    `;
    const params: any[] = [startDate, endDate];
    if (department_id) {
      query += ` AND w.department_id = $3`;
      params.push(department_id);
    }
    query += ` GROUP BY w.id, w.full_name, d.name ORDER BY w.full_name`;

    const result = await pool.query(query, params);
    const workersStats = result.rows.map((row: any) => ({
      ...row,
      total_days: row.present + row.late + row.absent + row.leave,
      attendance_percentage: ((row.present + row.late) / (row.present + row.late + row.absent) * 100).toFixed(1),
    }));
    return res.status(200).json({ year, month, workers: workersStats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch monthly attendance' });
  }
}