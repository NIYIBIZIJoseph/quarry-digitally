import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WorkerRow {
  id: number;
  name: string;
  department: string | null;
}

interface AttendanceRow {
  worker_id: number;
  date: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!await hasPermission(user.userId, 'attendance:view')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  try {
    // Week range using local dates
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    if (req.query.weekStart) {
      startDate = new Date(req.query.weekStart as string);
    }
    const weekStartStr = toLocalDateString(startDate);
    const weekEnd = new Date(startDate);
    weekEnd.setDate(startDate.getDate() + 6);
    const weekEndStr = toLocalDateString(weekEnd);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days: { date: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push({ date: toLocalDateString(d), label: dayLabels[i] });
    }

    // Workers query with branch isolation
    let workerBranchCondition = '';
    let workerParams: (string | number)[] = [];
    if (user.role !== 'superadmin' && user.branchId) {
      workerBranchCondition = ' AND w.branch_id = $1';
      workerParams = [user.branchId];
    } else if (user.role === 'superadmin' && req.query.branch_id) {
      workerBranchCondition = ' AND w.branch_id = $1';
      workerParams = [req.query.branch_id as string];
    }

    let deptCondition = '';
    let deptValue: string | null = null;
    if (req.query.department_id) {
      deptCondition = ` AND w.department_id = $${workerParams.length + 1}`;
      deptValue = req.query.department_id as string;
    }

    let workersQuery = `
      SELECT w.id, w.full_name as name, d.name as department
      FROM workers w
      LEFT JOIN departments d ON w.department_id = d.id
      WHERE w.deleted_at IS NULL ${workerBranchCondition}
    `;
    if (deptCondition) workersQuery += deptCondition;
    workersQuery += ' ORDER BY w.full_name';

    const workersParams = deptValue ? [...workerParams, deptValue] : workerParams;
    const workersRes = await pool.query<WorkerRow>(workersQuery, workersParams);
    const workers = workersRes.rows;

    if (workers.length === 0) {
      return res.status(200).json({
        week: { start: weekStartStr, end: weekEndStr },
        days,
        workers: [],
        summary: { totalWorkers: 0, presentToday: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0 },
      });
    }

    // Attendance query using local dates
    const workerIds = workers.map((w: WorkerRow) => w.id);
    const workerPlaceholders = workerIds.map((_: number, idx: number) => `$${idx + 1}`).join(',');
    const dateStartIdx = workerIds.length + 1;
    const dateEndIdx = workerIds.length + 2;

    let attendanceBranchCondition = '';
    let attendanceBranchParams: (string | number)[] = [];
    if (user.role !== 'superadmin' && user.branchId) {
      attendanceBranchCondition = ` AND a.branch_id = $${dateEndIdx + 1}`;
      attendanceBranchParams = [user.branchId];
    } else if (user.role === 'superadmin' && req.query.branch_id) {
      attendanceBranchCondition = ` AND a.branch_id = $${dateEndIdx + 1}`;
      attendanceBranchParams = [req.query.branch_id as string];
    }

    const attendanceQuery = `
      SELECT a.worker_id, a.date::text as date, a.status
      FROM attendance a
      WHERE a.worker_id IN (${workerPlaceholders})
        AND a.date BETWEEN $${dateStartIdx} AND $${dateEndIdx}
        AND a.deleted_at IS NULL
        ${attendanceBranchCondition}
    `;
    const attendanceParams = [...workerIds, weekStartStr, weekEndStr, ...attendanceBranchParams];
    const attendanceRes = await pool.query<AttendanceRow>(attendanceQuery, attendanceParams);

    const attendanceMap = new Map<string, string>();
    for (const row of attendanceRes.rows) {
      attendanceMap.set(`${row.worker_id}|${row.date}`, row.status);
    }

    // Build workers with days
    const workersWithDays = workers.map((worker: WorkerRow) => ({
      id: worker.id,
      name: worker.name,
      department: worker.department,
      days: days.map((day: { date: string; label: string }) => ({
        status: attendanceMap.get(`${worker.id}|${day.date}`) || 'absent',
      })),
    }));

    // Today's summary
    const todayStr = toLocalDateString(new Date());
    let presentToday = 0, absentToday = 0, lateToday = 0, onLeaveToday = 0;
    const todayIndex = days.findIndex((d: { date: string }) => d.date === todayStr);
    if (todayIndex !== -1) {
      for (const w of workersWithDays) {
        const status = w.days[todayIndex]?.status;
        if (status === 'present') presentToday++;
        else if (status === 'late') lateToday++;
        else if (status === 'leave') onLeaveToday++;
        else absentToday++;
      }
    }

    return res.status(200).json({
      week: { start: weekStartStr, end: weekEndStr },
      days,
      workers: workersWithDays,
      summary: { totalWorkers: workers.length, presentToday, absentToday, lateToday, onLeaveToday },
    });
  } catch (err: any) {
    console.error('Weekly API error:', err);
    return res.status(500).json({ error: err.message });
  }
}