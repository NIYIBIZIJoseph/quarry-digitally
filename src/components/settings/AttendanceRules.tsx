import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Rule {
  key: string;
  value: string;
  description: string;
}

export default function AttendanceRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === 'superadmin';

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance rules');
      const data = await res.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const updateRule = async (key: string, value: string) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Update failed');
      setRules(prev => prev.map(r => r.key === key ? { ...r, value } : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => rules.find(r => r.key === key)?.value || '';

  if (loading) return <div>{t('loadingAttendanceRules') || 'Loading attendance rules...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('attendanceRules') || 'Attendance Rules'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>

        {/* General Rules */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h4><FontAwesomeIcon icon={faSun} /> {t('generalRules') || 'General Rules'}</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('lateThreshold') || 'Late Threshold (minutes)'}</label>
            <input
              type="number"
              value={getValue('late_threshold_minutes')}
              onChange={(e) => updateRule('late_threshold_minutes', e.target.value)}
              disabled={!canEdit || saving}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <small>{t('lateThresholdDesc') || 'Minutes after shift start considered late.'}</small>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('maxLeaveDays') || 'Max Leave Days Per Year'}</label>
            <input
              type="number"
              value={getValue('max_leave_days_per_year')}
              onChange={(e) => updateRule('max_leave_days_per_year', e.target.value)}
              disabled={!canEdit || saving}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <small>{t('maxLeaveDaysDesc') || 'Maximum paid leave days allowed per year.'}</small>
          </div>
        </div>

        {/* Day Shift */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h4><FontAwesomeIcon icon={faSun} /> {t('dayShift') || 'Day Shift'}</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('startTime') || 'Start Time'}</label>
            <input type="time" value={getValue('day_shift_start')} onChange={e => updateRule('day_shift_start', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('endTime') || 'End Time'}</label>
            <input type="time" value={getValue('day_shift_end')} onChange={e => updateRule('day_shift_end', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('lunchBreakStart') || 'Lunch Break Start'}</label>
            <input type="time" value={getValue('day_shift_lunch_start')} onChange={e => updateRule('day_shift_lunch_start', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('lunchBreakEnd') || 'Lunch Break End'}</label>
            <input type="time" value={getValue('day_shift_lunch_end')} onChange={e => updateRule('day_shift_lunch_end', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
        </div>

        {/* Night Shift */}
        <div>
          <h4><FontAwesomeIcon icon={faMoon} /> {t('nightShift') || 'Night Shift'}</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('startTime') || 'Start Time'}</label>
            <input type="time" value={getValue('night_shift_start')} onChange={e => updateRule('night_shift_start', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('endTimeNextDay') || 'End Time (next day)'}</label>
            <input type="time" value={getValue('night_shift_end')} onChange={e => updateRule('night_shift_end', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('mealBreakStart') || 'Meal Break Start'}</label>
            <input type="time" value={getValue('night_shift_meal_start')} onChange={e => updateRule('night_shift_meal_start', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>{t('mealBreakEnd') || 'Meal Break End'}</label>
            <input type="time" value={getValue('night_shift_meal_end')} onChange={e => updateRule('night_shift_meal_end', e.target.value)} disabled={!canEdit || saving} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>
        </div>

        {saving && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>
    </div>
  );
}