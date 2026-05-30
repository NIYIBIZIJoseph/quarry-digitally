import { useEffect, useState } from 'react';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { ROLES, type Role } from "@/lib/roles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSun, faClock, faHourglassHalf, faCalendarAlt, 
  faMoon, faUtensils, faCoffee, faSave, faEdit,
  faBuilding, faUserClock, faBell
} from '@fortawesome/free-solid-svg-icons';
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
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
    fetchBranches();
  }, []);

  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRules = async (branchId?: number) => {
    setLoading(true);
    try {
      const url = branchId 
        ? `/api/settings/attendance-rules?branch_id=${branchId}`
        : '/api/settings/attendance-rules';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance rules');
      const data = await res.json();
      setRules(data);
      // Initialize edited values
      const initialValues: Record<string, string> = {};
      data.forEach((rule: Rule) => {
        initialValues[rule.key] = rule.value;
      });
      setEditedValues(initialValues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      fetchRules(selectedBranch);
    }
  }, [selectedBranch]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const updateRule = async (key: string, value: string) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/attendance-rules', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          key, 
          value,
          branch_id: selectedBranch 
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setRules(prev => prev.map(r => (r.key === key ? { ...r, value } : r)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAllRules = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        const currentRule = rules.find(r => r.key === key);
        if (currentRule && currentRule.value !== value) {
          await updateRule(key, value);
        }
      }
      alert('All rules saved successfully!');
    } catch (err: any) {
      alert('Failed to save rules: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => editedValues[key] || rules.find(r => r.key === key)?.value || '';

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingAttendanceRules') || 'Loading attendance rules...'}</div>;
  if (error) return <div style={{ color: '#dc2626', padding: '1rem' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faClock} /> {t('attendanceRules') || 'Attendance Rules'}
        </h3>
        
        {/* Branch selector for superadmin */}
        {canEdit && branches.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faBuilding} style={{ color: '#6b7280' }} />
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        {/* General Rules Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faSun} /> {t('generalRules') || 'General Rules'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            {/* Late Threshold */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                {t('lateThreshold') || 'Late Threshold (minutes)'}
              </label>
              <input
                type="number"
                value={getValue('late_threshold_minutes')}
                onChange={(e) => handleValueChange('late_threshold_minutes', e.target.value)}
                onBlur={() => updateRule('late_threshold_minutes', getValue('late_threshold_minutes'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
              <small style={{ color: '#6b7280' }}>Minutes after shift start considered late</small>
            </div>

            {/* Max Leave Days */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                {t('maxLeaveDays') || 'Max Leave Days Per Year'}
              </label>
              <input
                type="number"
                value={getValue('max_leave_days_per_year')}
                onChange={(e) => handleValueChange('max_leave_days_per_year', e.target.value)}
                onBlur={() => updateRule('max_leave_days_per_year', getValue('max_leave_days_per_year'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
              <small style={{ color: '#6b7280' }}>Maximum paid leave days allowed per year</small>
            </div>

            {/* Auto-mark Absent After */}
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faUserClock} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
                {t('autoMarkAbsent') || 'Auto-mark Absent After (hours)'}
              </label>
              <input
                type="number"
                value={getValue('auto_mark_absent_hours')}
                onChange={(e) => handleValueChange('auto_mark_absent_hours', e.target.value)}
                onBlur={() => updateRule('auto_mark_absent_hours', getValue('auto_mark_absent_hours'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
              <small style={{ color: '#6b7280' }}>Mark as absent if no check-in after this many hours</small>
            </div>
          </div>
        </div>

        {/* Day Shift Section */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faSun} /> {t('dayShift') || 'Day Shift'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>{t('startTime') || 'Start Time'}</label>
              <input
                type="time"
                value={getValue('day_shift_start')}
                onChange={(e) => handleValueChange('day_shift_start', e.target.value)}
                onBlur={() => updateRule('day_shift_start', getValue('day_shift_start'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>{t('endTime') || 'End Time'}</label>
              <input
                type="time"
                value={getValue('day_shift_end')}
                onChange={(e) => handleValueChange('day_shift_end', e.target.value)}
                onBlur={() => updateRule('day_shift_end', getValue('day_shift_end'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faUtensils} /> {t('lunchBreak') || 'Lunch Break'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="time"
                  value={getValue('day_shift_lunch_start')}
                  onChange={(e) => handleValueChange('day_shift_lunch_start', e.target.value)}
                  onBlur={() => updateRule('day_shift_lunch_start', getValue('day_shift_lunch_start'))}
                  disabled={!canEdit || saving}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="Start"
                />
                <span>-</span>
                <input
                  type="time"
                  value={getValue('day_shift_lunch_end')}
                  onChange={(e) => handleValueChange('day_shift_lunch_end', e.target.value)}
                  onBlur={() => updateRule('day_shift_lunch_end', getValue('day_shift_lunch_end'))}
                  disabled={!canEdit || saving}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="End"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Night Shift Section */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faMoon} /> {t('nightShift') || 'Night Shift'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>{t('startTime') || 'Start Time'}</label>
              <input
                type="time"
                value={getValue('night_shift_start')}
                onChange={(e) => handleValueChange('night_shift_start', e.target.value)}
                onBlur={() => updateRule('night_shift_start', getValue('night_shift_start'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>{t('endTime') || 'End Time (next day)'}</label>
              <input
                type="time"
                value={getValue('night_shift_end')}
                onChange={(e) => handleValueChange('night_shift_end', e.target.value)}
                onBlur={() => updateRule('night_shift_end', getValue('night_shift_end'))}
                disabled={!canEdit || saving}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                <FontAwesomeIcon icon={faCoffee} /> {t('mealBreak') || 'Meal Break'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="time"
                  value={getValue('night_shift_meal_start')}
                  onChange={(e) => handleValueChange('night_shift_meal_start', e.target.value)}
                  onBlur={() => updateRule('night_shift_meal_start', getValue('night_shift_meal_start'))}
                  disabled={!canEdit || saving}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="Start"
                />
                <span>-</span>
                <input
                  type="time"
                  value={getValue('night_shift_meal_end')}
                  onChange={(e) => handleValueChange('night_shift_meal_end', e.target.value)}
                  onBlur={() => updateRule('night_shift_meal_end', getValue('night_shift_meal_end'))}
                  disabled={!canEdit || saving}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  placeholder="End"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save All Button */}
        {canEdit && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={saveAllRules}
              disabled={saving}
              style={{
                background: '#f59e0b',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              <FontAwesomeIcon icon={faSave} />
              {saving ? (t('saving') || 'Saving...') : (t('saveAllRules') || 'Save All Rules')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}