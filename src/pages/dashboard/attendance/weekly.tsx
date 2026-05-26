import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faFileExport,
  faCheckCircle,
  faExclamationTriangle,
  faUmbrellaBeach,
  faTimesCircle,
  faSave,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function WeeklyAttendance() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (start?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.append('weekStart', start);
    if (departmentFilter) params.append('department_id', departmentFilter);
    params.append('_t', Date.now().toString());
    try {
      const res = await fetch(`/api/attendance/weekly?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log('Fetched weekly data:', json);
      setData(json);
      if (!weekStart && json.week) setWeekStart(json.week.start);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetch('/api/departments', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (weekStart) fetchData(weekStart);
  }, [weekStart, departmentFilter, refreshKey]);

  const changeWeek = (delta: number) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + delta * 7);
    setWeekStart(formatLocalDate(current));
  };

  const handleCellClick = (worker: any, day: any, date: string) => {
    setSelectedCell({ worker, day, date });
    setOverrideStatus(day.status);
  };

  const handleOverride = async () => {
    if (!selectedCell) return;
    try {
      const res = await fetch('/api/attendance/override', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          worker_id: selectedCell.worker.id,
          date: selectedCell.date,
          status: overrideStatus,
          reason: 'Manual override',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('overrideFailed') || 'Override failed');
      setRefreshKey(prev => prev + 1);
      setSelectedCell(null);
    } catch (err: any) {
      alert(`${t('overrideFailed') || 'Override error'}: ${err.message}`);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = [t('worker') || 'Worker', t('department') || 'Department', ...data.days.map((d: any) => d.label)];
    const rows = data.workers.map((w: any) => [
      w.name,
      w.department,
      ...w.days.map((d: any) => {
        if (d.status === 'present') return 'P';
        if (d.status === 'late') return 'L';
        if (d.status === 'leave') return 'LV';
        return 'A';
      }),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${data.week.start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Translate day labels
  const getTranslatedDayLabel = (label: string) => {
    const dayMap: Record<string, string> = {
      'Mon': t('mon') || 'Mon',
      'Tue': t('tue') || 'Tue',
      'Wed': t('wed') || 'Wed',
      'Thu': t('thu') || 'Thu',
      'Fri': t('fri') || 'Fri',
      'Sat': t('sat') || 'Sat',
      'Sun': t('sun') || 'Sun',
    };
    return dayMap[label] || label;
  };

  if (loading) return <DashboardLayout>{t('loadingAttendance') || 'Loading attendance...'}</DashboardLayout>;
  if (error) return <DashboardLayout>{t('error') || 'Error'}: {error}</DashboardLayout>;
  if (!data) return <DashboardLayout>{t('noData') || 'No data'}</DashboardLayout>;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981' }} />;
      case 'late':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />;
      case 'leave':
        return <FontAwesomeIcon icon={faUmbrellaBeach} style={{ color: '#3b82f6' }} />;
      default:
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#dc2626' }} />;
    }
  };

  return (
    <DashboardLayout>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <button onClick={() => changeWeek(-1)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faChevronLeft} /> {t('prevWeek') || 'Prev Week'}
        </button>
        <span>{t('weekStarting') || 'Week starting'} {data.week.start}</span>
        <button onClick={() => changeWeek(1)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          {t('nextWeek') || 'Next Week'} <FontAwesomeIcon icon={faChevronRight} />
        </button>
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="">{t('allDepartments') || 'All Departments'}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={exportCSV} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '8px' }}>
          <FontAwesomeIcon icon={faEye} /> {t('totalWorkers') || 'Total Workers'}: {data.summary.totalWorkers}
        </div>
        <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '8px' }}>
          <FontAwesomeIcon icon={faCheckCircle} /> {t('presentToday') || 'Present Today'}: {data.summary.presentToday}
        </div>
        <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>
          <FontAwesomeIcon icon={faTimesCircle} /> {t('absentToday') || 'Absent Today'}: {data.summary.absentToday}
        </div>
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {t('lateToday') || 'Late Today'}: {data.summary.lateToday}
        </div>
        <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '8px' }}>
          <FontAwesomeIcon icon={faUmbrellaBeach} /> {t('onLeaveToday') || 'On Leave'}: {data.summary.onLeaveToday}
        </div>
      </div>

      {/* Attendance Table */}
      <div style={{ overflowX: 'auto' }} key={refreshKey}>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left' }}>{t('workerDepartment') || 'Worker / Department'}</th>
              {data.days.map((day: any) => (
                <th key={day.date} style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'center' }}>
                  {getTranslatedDayLabel(day.label)}<br /><small>{day.date}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.workers.map((worker: any) => (
              <tr key={worker.id} style={{ transition: 'background 0.2s' }}>
                <td style={{ border: '1px solid #e5e7eb', padding: '12px', fontWeight: '500' }}>
                  {worker.name}<br /><small>{worker.department}</small>
                </td>
                {worker.days.map((day: any, idx: number) => (
                  <td
                    key={`${worker.id}-${idx}`}
                    onClick={() => handleCellClick(worker, day, data.days[idx].date)}
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    title={t('clickToOverride') || 'Click to override'}
                  >
                    {statusIcon(day.status)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {selectedCell && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
            <h3>{t('overrideAttendance') || 'Override Attendance'}</h3>
            <p><strong>{selectedCell.worker.name}</strong> – {selectedCell.date}</p>
            <p>{t('currentStatus') || 'Current status'}: {selectedCell.day.status}</p>
            <select
              value={overrideStatus}
              onChange={e => setOverrideStatus(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '12px 0', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="present">{t('present') || 'Present'}</option>
              <option value="late">{t('late') || 'Late'}</option>
              <option value="absent">{t('absent') || 'Absent'}</option>
              <option value="leave">{t('leave') || 'Leave'}</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedCell(null)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                {t('cancel') || 'Cancel'}
              </button>
              <button onClick={handleOverride} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faSave} /> {t('saveOverride') || 'Save Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}