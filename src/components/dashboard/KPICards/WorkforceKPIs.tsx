import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function WorkforceKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ activeWorkers: 0, presentToday: 0, absentToday: 0, lateToday: 0, onLeave: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      const workersRes = await fetch('/api/workers', { headers });
      const workers = await workersRes.json();
      const active = workers.filter((w: any) => w.is_active).length;
      const attendanceRes = await fetch('/api/attendance/weekly', { headers });
      const attendanceData = await attendanceRes.json();
      const summary = attendanceData.summary || {};
      setStats({ activeWorkers: active, presentToday: summary.presentToday || 0, absentToday: summary.absentToday || 0, lateToday: summary.lateToday || 0, onLeave: summary.onLeaveToday || 0 });
    };
    fetchData();
  }, []);

  const cards = [
    { label: t('activeWorkers'), value: stats.activeWorkers, icon: faUsers, color: '#fff' },
    { label: t('presentToday'), value: stats.presentToday, sub: t('onSite'), icon: faCheckCircle, color: '#d1fae5' },
    { label: t('absent'), value: stats.absentToday, sub: t('unexcused'), icon: faTimesCircle, color: '#fee2e2' },
    { label: t('late'), value: stats.lateToday, sub: t('arrivedLate'), icon: faExclamationTriangle, color: '#fef3c7' },
    { label: t('onLeave'), value: stats.onLeave, sub: t('approved'), icon: faUmbrellaBeach, color: '#e0e7ff' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{ background: card.color, padding: '0.75rem', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
            <FontAwesomeIcon icon={card.icon} fixedWidth /> {card.label}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{card.value}</div>
          {card.sub && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}