import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faHistory } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const res = await fetch(`/api/audit?page=${page}&limit=30`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingAuditLogs') || 'Loading audit logs...'}</div>;

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        <FontAwesomeIcon icon={faHistory} /> {t('systemAuditLogs') || 'System Audit Logs'}
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('user') || 'User'}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('action') || 'Action'}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('target') || 'Target'}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('ipAddress') || 'IP Address'}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('time') || 'Time'}</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('details') || 'Details'}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{log.user_id || 'system'}</td>
                <td style={{ padding: '12px' }}>{log.action}</td>
                <td style={{ padding: '12px' }}>{log.target_type}#{log.target_id}</td>
                <td style={{ padding: '12px' }}>{log.ip_address}</td>
                <td style={{ padding: '12px' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#f59e0b' }}>
                      <FontAwesomeIcon icon={faEye} /> {t('view') || 'View'}
                    </summary>
                    <div style={{ marginTop: '8px', fontSize: '12px', background: '#f9fafb', padding: '8px', borderRadius: '6px' }}>
                      <strong>{t('old') || 'Old'}:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>{JSON.stringify(log.old_data, null, 2)}</pre>
                      <strong>{t('new') || 'New'}:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>{JSON.stringify(log.new_data, null, 2)}</pre>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: '6px 12px', background: '#e5e7eb', borderRadius: '6px', border: 'none', cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}
        >
          {t('previous') || 'Previous'}
        </button>
        <span style={{ padding: '6px 12px' }}>{t('page') || 'Page'} {page} {t('of') || 'of'} {totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          style={{ padding: '6px 12px', background: '#e5e7eb', borderRadius: '6px', border: 'none', cursor: 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
        >
          {t('next') || 'Next'}
        </button>
      </div>
    </div>
  );
}