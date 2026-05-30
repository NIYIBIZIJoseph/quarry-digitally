import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get today's attendance stats
    const todayStats = await pool.query(
      `
      SELECT 
        COUNT(DISTINCT w.id) as total_workers,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as on_leave
      FROM workers w
      LEFT JOIN attendance a ON a.worker_id = w.id AND a.date = CURRENT_DATE
      WHERE w.deleted_at IS NULL
      `
    );

    // Get attendance trend for last 7 days
    const attendanceTrend = await pool.query(
      `
      SELECT 
        a.date,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
      FROM attendance a
      WHERE a.date > CURRENT_DATE - INTERVAL '7 days'
        AND a.deleted_at IS NULL
      GROUP BY a.date
      ORDER BY a.date ASC
      `
    );

    // Get top reliable workers (most present days in last 30 days)
    const workerRanking = await pool.query(
      `
      SELECT 
        w.full_name as name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(*) as total_days
      FROM workers w
      JOIN attendance a ON a.worker_id = w.id
      WHERE a.date > CURRENT_DATE - INTERVAL '30 days'
        AND w.deleted_at IS NULL
        AND a.deleted_at IS NULL
      GROUP BY w.id, w.full_name
      ORDER BY present_days DESC
      LIMIT 5
      `
    );

    return res.status(200).json({
      todayStats: todayStats.rows[0] || { total_workers: 0, present: 0, absent: 0, late: 0, on_leave: 0 },
      attendanceTrend: attendanceTrend.rows,
      workerRanking: workerRanking.rows
    });

  } catch (error) {
    console.error("Operational analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch operational data" });
  }
});