import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserClock, faSpinner, faEye, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function PendingApprovals() {
  const { t } = useTranslation();
  const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workers', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(workers => {
        setPendingWorkers(workers.filter((w: any) => !w.is_active));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '2rem', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading')}
      </div>
    );
  }

  if (pendingWorkers.length === 0) return null;

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '2rem' }}>
      <h3>
        <FontAwesomeIcon icon={faUserClock} style={{ marginRight: '8px', color: '#f59e0b' }} />
        {t('pendingApprovals')} ({pendingWorkers.length})
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {pendingWorkers.slice(0, 5).map((w, idx) => (
          <li key={w.id} style={{ borderBottom: idx < pendingWorkers.length - 1 ? '1px solid #e5e7eb' : 'none', padding: '10px 0' }}>
            <Link href={`/dashboard/workers/${w.id}`} style={{ textDecoration: 'none', color: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <FontAwesomeIcon icon={faUserClock} style={{ marginRight: '8px', color: '#f59e0b' }} />
                <strong>{w.name}</strong>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>
                <FontAwesomeIcon icon={faEye} style={{ marginRight: '4px' }} />
                {t('pendingActivation')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/dashboard/workers?pending=true" style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem', display: 'inline-block' }}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '4px' }} />
        {t('viewAllPending')} →
      </Link>
    </div>
  );
}