import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faClock, faUser, faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function RecentActivity() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/activity', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { setActivities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return <FontAwesomeIcon icon={faPlus} style={{ color: '#10b981', marginRight: '6px' }} />;
      case 'UPDATE': return <FontAwesomeIcon icon={faEdit} style={{ color: '#3b82f6', marginRight: '6px' }} />;
      case 'DELETE': return <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626', marginRight: '6px' }} />;
      default: return <FontAwesomeIcon icon={faUser} style={{ color: '#6b7280', marginRight: '6px' }} />;
    }
  };

  const getActionText = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return t('actionCreated');
      case 'UPDATE': return t('actionUpdated');
      case 'DELETE': return t('actionDeleted');
      default: return action || t('actionUnknown');
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading')}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h3>
        <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px', color: '#f59e0b' }} />
        {t('recentActivity')}
      </h3>
      {activities.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>{t('noRecentActivity')}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {activities.slice(0, 5).map((act, idx) => (
            <li key={idx} style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                {getActionIcon(act.action)}
                <strong>{getActionText(act.action)}</strong>
                <span style={{ color: '#6b7280' }}>–</span>
                <span>{act.target_type}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px' }} />
                {act.created_at ? new Date(act.created_at).toLocaleString() : t('unknown')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}