import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function AttendanceSnapshot() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState({ presentToday: 0, absentToday: 0, lateToday: 0, onLeaveToday: 0, totalWorkers: 0 });

  useEffect(() => {
    fetch('/api/attendance/weekly', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setSummary(data.summary || {}))
      .catch(console.error);
  }, []);

  const total = summary.totalWorkers || 0;
  const present = summary.presentToday || 0;
  const percent = total ? Math.round((present / total) * 100) : 0;

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h3>{t('attendanceToday')}</h3>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{percent}%</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div>
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '8px' }} />
          {t('present')}: {present}
        </div>
        <div>
          <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#dc2626', marginRight: '8px' }} />
          {t('absent')}: {summary.absentToday || 0}
        </div>
        <div>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b', marginRight: '8px' }} />
          {t('late')}: {summary.lateToday || 0}
        </div>
        <div>
          <FontAwesomeIcon icon={faUmbrellaBeach} style={{ color: '#3b82f6', marginRight: '8px' }} />
          {t('onLeave')}: {summary.onLeaveToday || 0}
        </div>
      </div>
      <Link href="/dashboard/attendance/weekly" style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem', display: 'inline-block' }}>
        {t('viewFullAttendance')} →
      </Link>
    </div>
  );
}