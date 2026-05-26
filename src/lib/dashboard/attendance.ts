import { getAuthHeaders } from '@/lib/auth-client';
import type { AttendanceSummary } from '@/types/dashboard';

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const res = await fetch('/api/attendance/weekly', { headers: getAuthHeaders() });
  const data = await res.json();
  return data.summary || { presentToday: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0, totalWorkers: 0 };
}