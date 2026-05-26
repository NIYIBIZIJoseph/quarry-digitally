import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Config {
  key: string;
  value: string;
  description: string;
}

export default function InventoryConfigSettings() {
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
      const res = await fetch('/api/settings/inventory-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch inventory config');
      let data = await res.json();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) data = data.data;
        else if (data.success && Array.isArray(data.data)) data = data.data;
        else data = [];
      }
      if (!Array.isArray(data)) data = [];
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
      const res = await fetch('/api/settings/inventory-config', {
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

  const getValue = (key: string) => {
    if (!Array.isArray(configs)) return '';
    const config = configs.find(c => c.key === key);
    return config?.value || '';
  };

  if (loading) return <div>{t('loadingInventoryConfig') || 'Loading inventory configuration...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('inventoryConfiguration') || 'Inventory Configuration'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultLowStockThreshold') || 'Default Low Stock Threshold (units)'}</label>
          <input
            type="number"
            value={getValue('inventory_default_low_stock_threshold')}
            onChange={(e) => updateConfig('inventory_default_low_stock_threshold', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small style={{ color: '#6b7280' }}>{t('defaultLowStockThresholdDesc') || 'Global default when a product has no reorder level.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('enableAutoRestockAlerts') || 'Enable Automatic Restock Alerts'}</label>
          <select
            value={getValue('inventory_auto_restock_alerts')}
            onChange={(e) => updateConfig('inventory_auto_restock_alerts', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultReorderQuantity') || 'Default Reorder Quantity'}</label>
          <input
            type="number"
            value={getValue('inventory_default_reorder_quantity')}
            onChange={(e) => updateConfig('inventory_default_reorder_quantity', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small style={{ color: '#6b7280' }}>{t('defaultReorderQuantityDesc') || 'Suggested quantity when restocking low stock items.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('stockMovementRetention') || 'Stock Movement Retention (days)'}</label>
          <input
            type="number"
            value={getValue('inventory_stock_movement_retention_days')}
            onChange={(e) => updateConfig('inventory_stock_movement_retention_days', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small style={{ color: '#6b7280' }}>{t('stockMovementRetentionDesc') || 'How many days to keep stock movement logs.'}</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('enableExpiryTracking') || 'Enable Expiry Tracking'}</label>
          <select
            value={getValue('inventory_enable_expiry_tracking')}
            onChange={(e) => updateConfig('inventory_enable_expiry_tracking', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('expiryWarningDays') || 'Expiry Warning Days'}</label>
          <input
            type="number"
            value={getValue('inventory_expiry_warning_days')}
            onChange={(e) => updateConfig('inventory_expiry_warning_days', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <small style={{ color: '#6b7280' }}>{t('expiryWarningDaysDesc') || 'Send alert this many days before expiry.'}</small>
        </div>

        {saving && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>
    </div>
  );
}