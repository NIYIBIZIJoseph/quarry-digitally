import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface Config {
  key: string;
  value: string;
  description: string;
}

export default function SupportConfigSettings() {
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
      const res = await fetch('/api/settings/support-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch support config');
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
      const res = await fetch('/api/settings/support-config', {
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

  if (loading) return <div>{t('loadingSupportConfig') || 'Loading support configuration...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('supportConfiguration') || 'Support Configuration'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultTicketPriority') || 'Default Ticket Priority'}</label>
          <select
            value={getValue('support_default_priority')}
            onChange={(e) => updateConfig('support_default_priority', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="low">{t('priorityLow') || 'Low'}</option>
            <option value="medium">{t('priorityMedium') || 'Medium'}</option>
            <option value="high">{t('priorityHigh') || 'High'}</option>
            <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('autoCloseDays') || 'Auto‑close Days (inactivity)'}</label>
          <input
            type="number"
            value={getValue('support_auto_close_days')}
            onChange={(e) => updateConfig('support_auto_close_days', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('autoCloseDaysDesc') || 'Days after last activity before auto‑closing a resolved ticket.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('emailNotifications') || 'Email Notifications'}</label>
          <select
            value={getValue('support_email_notifications')}
            onChange={(e) => updateConfig('support_email_notifications', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small>{t('emailNotificationsDesc') || 'Send email to assigned staff on ticket updates.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('smsNotificationsUrgent') || 'SMS Notifications for Urgent Tickets'}</label>
          <select
            value={getValue('support_sms_notifications_urgent')}
            onChange={(e) => updateConfig('support_sms_notifications_urgent', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small>{t('smsNotificationsUrgentDesc') || 'Requires SMS service integration.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultTicketCategory') || 'Default Ticket Category'}</label>
          <input
            type="text"
            value={getValue('support_default_category')}
            onChange={(e) => updateConfig('support_default_category', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('maxAttachmentsPerTicket') || 'Max Attachments per Ticket'}</label>
          <input
            type="number"
            value={getValue('support_max_attachments')}
            onChange={(e) => updateConfig('support_max_attachments', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small>{t('maxAttachmentsPerTicketDesc') || 'Limit number of files per ticket.'}</small>
        </div>

        {saving && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>
    </div>
  );
}