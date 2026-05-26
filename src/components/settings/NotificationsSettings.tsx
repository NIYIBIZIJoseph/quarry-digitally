import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface Config {
  key: string;
  value: string;
  description: string;
}

export default function NotificationsConfigSettings() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === 'superadmin';

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/notifications-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch notifications config');
      const data = await res.json();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const updateConfig = async (key: string, value: string) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications-config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => configs.find(c => c.key === key)?.value || '';

  if (loading) return <div>{t('loadingNotificationsConfig') || 'Loading notifications configuration...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('notificationsConfiguration') || 'Notifications Configuration'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('enableEmailNotifications') || 'Enable Email Notifications'}</label>
          <select
            value={getValue('notifications_email_enabled')}
            onChange={(e) => updateConfig('notifications_email_enabled', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('enableInAppNotifications') || 'Enable In‑App Notifications'}</label>
          <select
            value={getValue('notifications_in_app_enabled')}
            onChange={(e) => updateConfig('notifications_in_app_enabled', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small>{t('enableInAppNotificationsDesc') || 'Show notifications in the bell icon on the dashboard.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('emailAddressForAlerts') || 'Email Address for Alerts'}</label>
          <input
            type="email"
            value={getValue('notifications_email_address')}
            onChange={(e) => updateConfig('notifications_email_address', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('emailAddressForAlertsDesc') || 'System alerts will be sent to this address.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('lowStockAlertThreshold') || 'Low Stock Alert Threshold (units)'}</label>
          <input
            type="number"
            value={getValue('notifications_low_stock_threshold')}
            onChange={(e) => updateConfig('notifications_low_stock_threshold', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('lowStockAlertThresholdDesc') || 'Send alert when product stock falls below this number (global).'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('attendanceReminderTime') || 'Attendance Reminder Time (HH:MM)'}</label>
          <input
            type="time"
            value={getValue('notifications_attendance_reminder_time')}
            onChange={(e) => updateConfig('notifications_attendance_reminder_time', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('attendanceReminderTimeDesc') || 'Daily time to send a summary of absent/late workers.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('ticketEscalationHours') || 'Ticket Escalation After (hours)'}</label>
          <input
            type="number"
            value={getValue('notifications_ticket_escalation_hours')}
            onChange={(e) => updateConfig('notifications_ticket_escalation_hours', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('ticketEscalationHoursDesc') || 'Hours after which an urgent ticket without reply triggers an escalation alert.'}</small>
        </div>

        {saving && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>
    </div>
  );
}