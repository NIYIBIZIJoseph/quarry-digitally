import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function UIPreferencesSettings() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      setPrefs(data);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const updatePref = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setPrefs(prev => ({ ...prev, [key]: value }));
      setMessage(t('preferenceSaved') || 'Preference saved');
      setTimeout(() => setMessage(''), 2000);
      applyPreference(key, value);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyPreference = (key: string, value: string) => {
    switch (key) {
      case 'theme':
        document.documentElement.setAttribute('data-theme', value);
        break;
      case 'sidebar_collapsed':
        window.dispatchEvent(new CustomEvent('sidebar-preference', { detail: value === 'true' }));
        break;
      case 'language':
        localStorage.setItem('preferred_language', value);
        window.location.reload();
        break;
      case 'compact_mode':
        document.body.classList.toggle('compact-mode', value === 'true');
        break;
    }
  };

  const getValue = (key: string, defaultValue: string) => prefs[key] || defaultValue;

  if (loading) return <div>{t('loadingUIPreferences') || 'Loading UI preferences...'}</div>;

  return (
    <div>
      <h3>{t('uiPreferences') || 'UI Preferences'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('theme') || 'Theme'}</label>
          <select
            value={getValue('theme', 'light')}
            onChange={(e) => updatePref('theme', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="light">{t('light') || 'Light'}</option>
            <option value="dark">{t('dark') || 'Dark'}</option>
            <option value="system">{t('systemDefault') || 'System default'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('sidebarBehaviour') || 'Sidebar Behaviour'}</label>
          <select
            value={getValue('sidebar_collapsed', 'false')}
            onChange={(e) => updatePref('sidebar_collapsed', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="false">{t('expandedByDefault') || 'Expanded by default'}</option>
            <option value="true">{t('collapsedByDefault') || 'Collapsed by default'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultDashboardView') || 'Default Dashboard View'}</label>
          <select
            value={getValue('default_dashboard', '/dashboard')}
            onChange={(e) => updatePref('default_dashboard', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="/dashboard">{t('overview') || 'Overview'}</option>
            <option value="/dashboard/orders">{t('orders') || 'Orders'}</option>
            <option value="/dashboard/workers">{t('workers') || 'Workers'}</option>
            <option value="/dashboard/attendance/weekly">{t('attendance') || 'Attendance'}</option>
            <option value="/dashboard/inventory">{t('inventory') || 'Inventory'}</option>
            <option value="/dashboard/analytics">{t('analytics') || 'Analytics'}</option>
            <option value="/dashboard/support">{t('support') || 'Support'}</option>
            <option value="/dashboard/settings">{t('settings') || 'Settings'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('language') || 'Language'}</label>
          <select
            value={getValue('language', 'en')}
            onChange={(e) => updatePref('language', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('dateFormat') || 'Date Format'}</label>
          <select
            value={getValue('date_format', 'DD/MM/YYYY')}
            onChange={(e) => updatePref('date_format', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('timeFormat') || 'Time Format'}</label>
          <select
            value={getValue('time_format', '24h')}
            onChange={(e) => updatePref('time_format', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="12h">12‑hour (AM/PM)</option>
            <option value="24h">24‑hour</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('notificationsSound') || 'Notifications Sound'}</label>
          <select
            value={getValue('notifications_sound', 'true')}
            onChange={(e) => updatePref('notifications_sound', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('compactMode') || 'Compact Mode (reduces whitespace)'}</label>
          <select
            value={getValue('compact_mode', 'false')}
            onChange={(e) => updatePref('compact_mode', e.target.value)}
            disabled={saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="false">{t('disabled') || 'Disabled'}</option>
            <option value="true">{t('enabled') || 'Enabled'}</option>
          </select>
        </div>

        {message && <div style={{ marginTop: '1rem', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>{message}</div>}
        {saving && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</div>}
      </div>
    </div>
  );
}