import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSave, faTimes, faBuilding, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Branch {
  id: number;
  name: string;
  location: string;
}

interface Department {
  id: number;
  name: string;
}

interface GlobalSetting {
  key: string;
  value: string;
  description?: string;
}

export default function OrganizationSettings() {
  const { t } = useTranslation();
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', location: '' });
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [globalRes, branchesRes, deptsRes] = await Promise.all([
        fetch('/api/settings', { headers: getAuthHeaders() }),
        fetch('/api/branches', { headers: getAuthHeaders() }),
        fetch('/api/departments', { headers: getAuthHeaders() }),
      ]);
      if (!globalRes.ok) throw new Error('Failed to fetch global settings');
      if (!branchesRes.ok) throw new Error('Failed to fetch branches');
      if (!deptsRes.ok) throw new Error('Failed to fetch departments');
      setGlobalSettings(await globalRes.json());
      setBranches(await branchesRes.json());
      setDepartments(await deptsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateGlobalSetting = async (key: string, value: string) => {
    if (!canEdit) return;
    setSavingGlobal(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setGlobalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      } else {
        const err = await res.json();
        alert(err.error || t('updateFailed') || 'Update failed');
      }
    } catch (err) {
      alert(t('errorUpdatingSetting') || 'Error updating setting');
    } finally {
      setSavingGlobal(false);
    }
  };

  const getSettingValue = (key: string) => {
    return globalSettings.find(s => s.key === key)?.value || '';
  };

  const saveBranch = async () => {
    if (!branchForm.name.trim()) return;
    setSaving(true);
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(branchForm),
      });
      if (res.ok) {
        setShowBranchForm(false);
        setEditingBranch(null);
        setBranchForm({ name: '', location: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || t('saveFailed') || 'Save failed');
      }
    } catch (err) {
      alert(t('errorSavingBranch') || 'Error saving branch');
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (id: number) => {
    if (!confirm(t('confirmDeleteBranch') || 'Delete this branch? It will be soft‑deleted.')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) fetchData();
      else {
        const err = await res.json();
        alert(err.error || t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      alert(t('errorDeletingBranch') || 'Error deleting branch');
    }
  };

  const saveDepartment = async () => {
    if (!deptForm.name.trim()) return;
    setSaving(true);
    try {
      const url = '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';
      const body = editingDept ? { id: editingDept.id, name: deptForm.name } : { name: deptForm.name };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowDeptForm(false);
        setEditingDept(null);
        setDeptForm({ name: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || t('saveFailed') || 'Save failed');
      }
    } catch (err) {
      alert(t('errorSavingDepartment') || 'Error saving department');
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (id: number) => {
    if (!confirm(t('confirmDeleteDepartment') || 'Delete this department? Workers will lose department reference.')) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) fetchData();
      else {
        const err = await res.json();
        alert(err.error || t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      alert(t('errorDeletingDepartment') || 'Error deleting department');
    }
  };

  if (loading) return <div>{t('loadingOrganization') || 'Loading organization data...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      {/* Company Information (global settings) */}
      <div style={{ marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '12px' }}>
        <h3><FontAwesomeIcon icon={faBuilding} /> {t('companyInformation') || 'Company Information'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('companyName') || 'Company Name'}</label>
            {canEdit ? (
              <input
                type="text"
                value={getSettingValue('company_name')}
                onChange={(e) => updateGlobalSetting('company_name', e.target.value)}
                disabled={savingGlobal}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <span>{getSettingValue('company_name')}</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('taxRate') || 'Tax Rate (%)'}</label>
            {canEdit ? (
              <input
                type="number"
                step="0.1"
                value={getSettingValue('tax_rate')}
                onChange={(e) => updateGlobalSetting('tax_rate', e.target.value)}
                disabled={savingGlobal}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <span>{getSettingValue('tax_rate')}%</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('currency') || 'Currency'}</label>
            {canEdit ? (
              <input
                type="text"
                value={getSettingValue('currency')}
                onChange={(e) => updateGlobalSetting('currency', e.target.value)}
                disabled={savingGlobal}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <span>{getSettingValue('currency')}</span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('defaultLanguage') || 'Default Language'}</label>
            {canEdit ? (
              <select
                value={getSettingValue('default_language')}
                onChange={(e) => updateGlobalSetting('default_language', e.target.value)}
                disabled={savingGlobal}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
                <option value="zh">中文</option>
              </select>
            ) : (
              <span>{getSettingValue('default_language')}</span>
            )}
          </div>
        </div>
        {savingGlobal && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('saving') || 'Saving...'}</span>}
      </div>

      {/* Branches Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>{t('branches') || 'Branches'}</h3>
          {canEdit && (
            <button onClick={() => { setEditingBranch(null); setBranchForm({ name: '', location: '' }); setShowBranchForm(true); }} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('addBranch') || 'Add Branch'}
            </button>
          )}
        </div>
        {showBranchForm && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
            <input type="text" placeholder={t('branchName') || 'Branch Name'} value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="text" placeholder={t('location') || 'Location'} value={branchForm.location} onChange={e => setBranchForm({ ...branchForm, location: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveBranch} disabled={saving} style={{ background: '#f59e0b', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faSave} /> {t('save') || 'Save'}</button>
              <button onClick={() => { setShowBranchForm(false); setEditingBranch(null); }} style={{ background: '#e5e7eb', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}</button>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {branches.map(branch => (
            <div key={branch.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{branch.name}</strong><br /><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{branch.location || t('noLocation') || 'No location'}</span></div>
              {canEdit && (
                <div>
                  <button onClick={() => { setEditingBranch(branch); setBranchForm({ name: branch.name, location: branch.location || '' }); setShowBranchForm(true); }} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faEdit} /> {t('edit') || 'Edit'}</button>
                  <button onClick={() => deleteBranch(branch.id)} style={{ background: '#fee2e2', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}><FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Departments Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>{t('departments') || 'Departments'}</h3>
          {canEdit && (
            <button onClick={() => { setEditingDept(null); setDeptForm({ name: '' }); setShowDeptForm(true); }} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('addDepartment') || 'Add Department'}
            </button>
          )}
        </div>
        {showDeptForm && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
            <input type="text" placeholder={t('departmentName') || 'Department Name'} value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveDepartment} disabled={saving} style={{ background: '#f59e0b', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faSave} /> {t('save') || 'Save'}</button>
              <button onClick={() => { setShowDeptForm(false); setEditingDept(null); }} style={{ background: '#e5e7eb', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}</button>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {departments.map(dept => (
            <div key={dept.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{dept.name}</span>
              {canEdit && (
                <div>
                  <button onClick={() => { setEditingDept(dept); setDeptForm({ name: dept.name }); setShowDeptForm(true); }} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faEdit} /> {t('edit') || 'Edit'}</button>
                  <button onClick={() => deleteDepartment(dept.id)} style={{ background: '#fee2e2', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}><FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}