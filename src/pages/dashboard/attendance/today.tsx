import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function TodayAttendance() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecords, setTodayRecords] = useState<Record<number, any>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/workers', { headers: getAuthHeaders() }).then(res => res.json()),
      fetch('/api/attendance/records?date=today', { headers: getAuthHeaders() }).then(res => res.json()).catch(() => ({}))
    ]).then(([workersData, records]) => {
      setWorkers(workersData);
      setTodayRecords(records);
      setLoading(false);
    });
  }, []);

  const markAttendance = async (workerId: number, action: 'checkin' | 'checkout') => {
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ worker_id: workerId, action }),
      });
      if (res.ok) {
        const updated = await fetch('/api/attendance/records?date=today', { headers: getAuthHeaders() }).then(r => r.json());
        setTodayRecords(updated);
      } else {
        alert(t('markFailed') || 'Failed');
      }
    } catch (err) {
      alert(t('error') || 'Error');
    }
  };

  if (loading) return <DashboardLayout>{t('loading') || 'Loading...'}</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1>{t('todayAttendance') || 'Today\'s Attendance'}</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>{t('worker') || 'Worker'}</th>
            <th>{t('department') || 'Department'}</th>
            <th>{t('checkIn') || 'Check In'}</th>
            <th>{t('checkOut') || 'Check Out'}</th>
            <th>{t('actions') || 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {workers.map(w => {
            const record = todayRecords[w.id];
            return (
              <tr key={w.id}>
                <td>{w.full_name}</td>
                <td>{w.department_name}</td>
                <td>{record?.check_in ? record.check_in.slice(0,5) : '-'}</td>
                <td>{record?.check_out ? record.check_out.slice(0,5) : '-'}</td>
                <td>
                  {!record?.check_in && (
                    <button onClick={() => markAttendance(w.id, 'checkin')} style={{ background: '#10b981', marginRight: '8px', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                      {t('checkIn') || 'Check In'}
                    </button>
                  )}
                  {record?.check_in && !record?.check_out && (
                    <button onClick={() => markAttendance(w.id, 'checkout')} style={{ background: '#f59e0b', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>
                      {t('checkOut') || 'Check Out'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardLayout>
  );
}