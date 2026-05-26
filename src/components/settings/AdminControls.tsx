import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminControlsSettings() {
  const { t } = useTranslation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [message, setMessage] = useState('');

  const fetchMaintenanceMode = async () => {
    const res = await fetch('/api/admin/maintenance-mode', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setMaintenanceMode(data.enabled);
    }
  };

  const fetchSystemInfo = async () => {
    const res = await fetch('/api/admin/system-info', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setSystemInfo(data);
    }
  };

  useEffect(() => {
    Promise.all([fetchMaintenanceMode(), fetchSystemInfo()]).finally(() => setLoading(false));
  }, []);

  const toggleMaintenanceMode = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance-mode', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMaintenanceMode(!maintenanceMode);
      setMessage(t('maintenanceModeChanged')?.replace('{status}', !maintenanceMode ? t('enabled') : t('disabled')) || `Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    if (!confirm(t('confirmClearCache') || 'Clear application cache? This may cause a temporary slowdown.')) return;
    setCacheLoading(true);
    try {
      const res = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Clear cache failed');
      setMessage(t('cacheCleared') || 'Cache cleared (if applicable)');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCacheLoading(false);
    }
  };

  if (loading) return <div>{t('loadingAdminControls') || 'Loading admin controls...'}</div>;

  return (
    <div>
      <h3>{t('adminControls') || 'Admin Controls'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        {/* Maintenance Mode */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h4>{t('maintenanceMode') || 'Maintenance Mode'}</h4>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{t('maintenanceModeDesc') || 'When enabled, non‑admin users see a maintenance page.'}</p>
          <button
            onClick={toggleMaintenanceMode}
            disabled={saving}
            style={{
              background: maintenanceMode ? '#dc2626' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {saving ? (t('updating') || 'Updating...') : (maintenanceMode ? t('disableMaintenanceMode') || 'Disable Maintenance Mode' : t('enableMaintenanceMode') || 'Enable Maintenance Mode')}
          </button>
        </div>

        {/* Clear Cache */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h4>{t('clearApplicationCache') || 'Clear Application Cache'}</h4>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{t('clearCacheDesc') || 'Clear Next.js cache and temporary data.'}</p>
          <button
            onClick={clearCache}
            disabled={cacheLoading}
            style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            {cacheLoading ? (t('clearing') || 'Clearing...') : (t('clearCache') || 'Clear Cache')}
          </button>
        </div>

        {/* Database Backup */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h4>{t('databaseBackup') || 'Database Backup'}</h4>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{t('databaseBackupDesc') || 'Export full database backup or manage data retention.'}</p>
          <button
            onClick={() => window.location.href = '/dashboard/settings#data'}
            style={{ background: '#3b82f6', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
          >
            {t('goToDataManagement') || 'Go to Data Management'}
          </button>
        </div>

        {/* System Information */}
        <div>
          <h4>{t('systemInformation') || 'System Information'}</h4>
          {systemInfo ? (
            <pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto' }}>
              {JSON.stringify(systemInfo, null, 2)}
            </pre>
          ) : (
            <p>{t('unableToLoadSystemInfo') || 'Unable to load system info.'}</p>
          )}
        </div>

        {message && <div style={{ marginTop: '1rem', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>{message}</div>}
      </div>
    </div>
  );
}