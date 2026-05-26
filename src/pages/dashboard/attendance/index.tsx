import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function AttendancePage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/attendance/weekly', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardLayout>{t('loadingAttendance') || 'Loading attendance...'}</DashboardLayout>;
  if (error) return <DashboardLayout>{t('error') || 'Error'}: {error}</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1>{t('weeklyAttendance') || 'Weekly Attendance'}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </DashboardLayout>
  );
}