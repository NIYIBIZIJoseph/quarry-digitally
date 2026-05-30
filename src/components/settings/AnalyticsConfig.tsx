import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faCalendarAlt, faSync, faChartBar, 
  faChartPie, faChartSimple, faSave, faDatabase,
  faChartArea, faRefresh, faClock, faSlidersH
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from "@/lib/roles";

interface Config {
  key: string;
  value: string;
  description: string;
}

export default function AnalyticsConfigSettings() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/analytics-config', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch analytics config');
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
      const res = await fetch('/api/settings/analytics-config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
      setMessage(`${key} updated successfully`);
      setTimeout(() => setMessage(''), 3000);
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

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>{t('loadingAnalyticsConfig') || 'Loading analytics configuration...'}</div>;
  if (error) return <div style={{ color: '#dc2626', padding: '1rem' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <FontAwesomeIcon icon={faChartLine} /> {t('analyticsConfiguration') || 'Analytics Configuration'}
      </h3>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Configure how analytics data is displayed, cached, and refreshed across the dashboard.
      </p>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46' }}>
          <FontAwesomeIcon icon={faSave} /> {message}
        </div>
      )}

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        
        {/* Default Date Range */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('defaultDateRange') || 'Default Date Range'}
          </label>
          <select
            value={getValue('analytics_default_range')}
            onChange={(e) => updateConfig('analytics_default_range', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="last_7_days">{t('last7Days') || 'Last 7 days'}</option>
            <option value="last_30_days">{t('last30Days') || 'Last 30 days'}</option>
            <option value="this_month">{t('thisMonth') || 'This month'}</option>
            <option value="this_year">{t('thisYear') || 'This year'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Default date range for all analytics charts
          </small>
        </div>

        {/* Chart Refresh Interval */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faRefresh} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('chartRefreshInterval') || 'Chart Refresh Interval (seconds)'}
          </label>
          <select
            value={getValue('analytics_refresh_interval')}
            onChange={(e) => updateConfig('analytics_refresh_interval', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="60">{t('seconds60') || '60 seconds'}</option>
            <option value="300">{t('minutes5') || '5 minutes'}</option>
            <option value="600">{t('minutes10') || '10 minutes'}</option>
            <option value="3600">{t('hour1') || '1 hour'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            How often charts automatically refresh with new data
          </small>
        </div>

        {/* Default Analytics Tab */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('defaultAnalyticsTab') || 'Default Analytics Tab'}
          </label>
          <select
            value={getValue('analytics_default_tab')}
            onChange={(e) => updateConfig('analytics_default_tab', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="operational">{t('operational') || 'Operational'}</option>
            <option value="financial">{t('financial') || 'Financial'}</option>
            <option value="inventory">{t('inventory') || 'Inventory'}</option>
            <option value="workforce">{t('workforce') || 'Workforce'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            First tab shown when opening Analytics dashboard
          </small>
        </div>

        {/* Enable Caching */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faDatabase} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('enableCaching') || 'Enable Caching'}
          </label>
          <select
            value={getValue('analytics_caching_enabled')}
            onChange={(e) => updateConfig('analytics_caching_enabled', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Cache analytics data to improve performance
          </small>
        </div>

        {/* Cache Duration */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('cacheDuration') || 'Cache Duration (minutes)'}
          </label>
          <input
            type="number"
            value={getValue('analytics_cache_minutes')}
            onChange={(e) => updateConfig('analytics_cache_minutes', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            How long to cache analytics data (only applies when caching is enabled)
          </small>
        </div>

        {/* Top Products Limit */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faChartSimple} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('topProductsLimit') || 'Top Products Limit'}
          </label>
          <input
            type="number"
            value={getValue('analytics_top_products_limit')}
            onChange={(e) => updateConfig('analytics_top_products_limit', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Number of products to show in top selling charts
          </small>
        </div>

        {/* Chart Type Preference */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('chartType') || 'Default Chart Type'}
          </label>
          <select
            value={getValue('analytics_default_chart_type')}
            onChange={(e) => updateConfig('analytics_default_chart_type', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="line">{t('lineChart') || 'Line Chart'}</option>
            <option value="bar">{t('barChart') || 'Bar Chart'}</option>
            <option value="pie">{t('pieChart') || 'Pie Chart'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Preferred chart type for revenue and sales data
          </small>
        </div>

        {/* Enable Real-time Updates */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faRefresh} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('enableRealTime') || 'Enable Real-time Updates'}
          </label>
          <select
            value={getValue('analytics_realtime_enabled')}
            onChange={(e) => updateConfig('analytics_realtime_enabled', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Automatically update charts when new data is available
          </small>
        </div>

        {/* Enable Predictive Analytics */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
            <FontAwesomeIcon icon={faChartArea} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
            {t('enablePredictiveAnalytics') || 'Enable Predictive Analytics'}
          </label>
          <select
            value={getValue('analytics_predictive_enabled')}
            onChange={(e) => updateConfig('analytics_predictive_enabled', e.target.value)}
            disabled={!canEdit || saving}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <option value="true">{t('enabled') || 'Enabled'}</option>
            <option value="false">{t('disabled') || 'Disabled'}</option>
          </select>
          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
            Show trend predictions based on historical data
          </small>
        </div>

        {saving && (
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faSave} spin /> {t('saving') || 'Saving configuration...'}
          </div>
        )}
      </div>
    </div>
  );
}