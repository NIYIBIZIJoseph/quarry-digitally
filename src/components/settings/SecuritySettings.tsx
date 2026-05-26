import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface Config {
  key: string;
  value: string;
  description: string;
}

export default function SecurityConfigSettings() {
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
      const res = await fetch('/api/settings/security-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch security config');
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
      const res = await fetch('/api/settings/security-config', {
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

  if (loading) return <div>{t('loadingSecurityConfig') || 'Loading security configuration...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('securityConfiguration') || 'Security Configuration'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('minPasswordLength') || 'Minimum Password Length'}</label>
          <input
            type="number"
            value={getValue('security_min_password_length')}
            onChange={(e) => updateConfig('security_min_password_length', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('requireUppercase') || 'Require Uppercase Letter'}</label>
          <select
            value={getValue('security_password_require_uppercase')}
            onChange={(e) => updateConfig('security_password_require_uppercase', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('yes') || 'Yes'}</option>
            <option value="false">{t('no') || 'No'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('requireNumber') || 'Require Number'}</label>
          <select
            value={getValue('security_password_require_number')}
            onChange={(e) => updateConfig('security_password_require_number', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('yes') || 'Yes'}</option>
            <option value="false">{t('no') || 'No'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('requireSpecialChar') || 'Require Special Character'}</label>
          <select
            value={getValue('security_password_require_special')}
            onChange={(e) => updateConfig('security_password_require_special', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('yes') || 'Yes'}</option>
            <option value="false">{t('no') || 'No'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('passwordExpiry') || 'Password Expiry (days, 0 = never)'}</label>
          <input
            type="number"
            value={getValue('security_password_expiry_days')}
            onChange={(e) => updateConfig('security_password_expiry_days', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('sessionTimeout') || 'Session Timeout (minutes)'}</label>
          <input
            type="number"
            value={getValue('security_session_timeout_minutes')}
            onChange={(e) => updateConfig('security_session_timeout_minutes', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('maxLoginAttempts') || 'Max Login Attempts'}</label>
          <input
            type="number"
            value={getValue('security_max_login_attempts')}
            onChange={(e) => updateConfig('security_max_login_attempts', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('lockoutDuration') || 'Lockout Duration (minutes)'}</label>
          <input
            type="number"
            value={getValue('security_lockout_duration_minutes')}
            onChange={(e) => updateConfig('security_lockout_duration_minutes', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('auditLogRetention') || 'Audit Log Retention (days)'}</label>
          <input
            type="number"
            value={getValue('security_audit_log_retention_days')}
            onChange={(e) => updateConfig('security_audit_log_retention_days', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('forceTwoFactor') || 'Force Two‑Factor Authentication'}</label>
          <select
            value={getValue('security_force_2fa')}
            onChange={(e) => updateConfig('security_force_2fa', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('force2faYes') || 'Yes (all users must enable 2FA)'}</option>
            <option value="false">{t('force2faNo') || 'No (users can choose)'}</option>
          </select>
        </div>

        {saving && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>
    </div>
  );
}