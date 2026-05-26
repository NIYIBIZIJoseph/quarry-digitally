import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrashAlt, faEye, faFileExport, faPrint,
  faUser, faCamera, faCheckCircle, faTimesCircle,
  faUpload, faSave, faTimes, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Department {
  id: number;
  name: string;
}

interface Worker {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  department_id: number;
  department_name: string;
  salary: number;
  join_date: string;
  location: string;
  image_url: string;
  is_active: boolean;
}

export default function DeepWorkers() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    department_id: '',
    salary: '',
    join_date: '',
    location: '',
    image_url: '',
    is_active: true,
  });

  const fetchWorkers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/workers', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkers(data);
      applyFilters(data, searchTerm, departmentFilter);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setWorkers([]);
      setFilteredWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: getAuthHeaders() });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
    }
  };

  const applyFilters = (workersList: Worker[], search: string, deptId: string) => {
    let filtered = [...workersList];
    if (search.trim()) {
      filtered = filtered.filter(w =>
        w.full_name.toLowerCase().includes(search.toLowerCase()) ||
        w.phone?.includes(search)
      );
    }
    if (deptId !== 'all') {
      filtered = filtered.filter(w => w.department_id?.toString() === deptId);
    }
    setFilteredWorkers(filtered);
  };

  useEffect(() => {
    fetchWorkers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters(workers, searchTerm, departmentFilter);
  }, [searchTerm, departmentFilter, workers]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm({ ...form, image_url: data.url });
      } else {
        alert(data.message || t('uploadFailed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      alert(t('fullNameRequired'));
      return;
    }
    const url = editingWorker ? `/api/workers/${editingWorker.id}` : '/api/workers';
    const method = editingWorker ? 'PUT' : 'POST';
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      salary: form.salary ? parseFloat(form.salary) : null,
      join_date: form.join_date || null,
      location: form.location || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchWorkers();
        setShowModal(false);
        setEditingWorker(null);
        setForm({ full_name: '', phone: '', email: '', department_id: '', salary: '', join_date: '', location: '', image_url: '', is_active: true });
      } else {
        const err = await res.json();
        alert(err.message || t('saveFailed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('networkError'));
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm(t('confirmDeactivate'))) return;
    try {
      const res = await fetch(`/api/workers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) fetchWorkers();
      else alert(t('deactivationFailed'));
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (worker: Worker) => {
    setEditingWorker(worker);
    const formattedJoinDate = worker.join_date ? worker.join_date.split('T')[0] : '';
    setForm({
      full_name: worker.full_name,
      phone: worker.phone || '',
      email: worker.email || '',
      department_id: worker.department_id?.toString() || '',
      salary: worker.salary?.toString() || '',
      join_date: formattedJoinDate,
      location: worker.location || '',
      image_url: worker.image_url || '',
      is_active: worker.is_active,
    });
    setShowModal(true);
  };

  const exportToCSV = () => {
    const headers = [t('name'), t('phone'), t('department'), t('salary'), t('joinDate'), t('location'), t('status')];
    const rows = filteredWorkers.map(w => [
      w.full_name,
      w.phone || '',
      w.department_name || '',
      w.salary?.toString() || '',
      w.join_date || '',
      w.location || '',
      w.is_active ? t('active') : t('inactive')
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers_deep.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printWorkers = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Workers Deep Report</title></head>
        <body>
          <h1>Workers Detailed Report</h1>
          <table border="1" cellpadding="8">
            <thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('department')}</th><th>${t('salary')}</th><th>${t('joinDate')}</th><th>${t('location')}</th><th>${t('status')}</th></tr></thead>
            <tbody>
              ${filteredWorkers.map(w => `
                <tr>
                  <td>${w.full_name}</td>
                  <td>${w.phone || '-'}</td>
                  <td>${w.department_name || '-'}</td>
                  <td>${w.salary?.toLocaleString() || '-'}</td>
                  <td>${w.join_date || '-'}</td>
                  <td>${w.location || '-'}</td>
                  <td>${w.is_active ? t('active') : t('inactive')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <DashboardLayout>{t('loadingWorkers')}</DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('deepSeek')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV')}
          </button>
          <button onClick={printWorkers} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPrint} /> {t('printPDF')}
          </button>
          <button onClick={() => { setEditingWorker(null); setForm({ full_name: '', phone: '', email: '', department_id: '', salary: '', join_date: '', location: '', image_url: '', is_active: true }); setShowModal(true); }} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPlus} /> {t('addWorker')}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder={t('searchByNamePhone')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 8px 8px 32px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }} />
        </div>
        <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}>
          <option value="all">{t('allDepartments')}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '1rem' }}><FontAwesomeIcon icon={faTimesCircle} /> {error}</div>}

      {filteredWorkers.length === 0 ? (
        <p>{t('noWorkersFound')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th>{t('image')}</th><th>{t('name')}</th><th>{t('phone')}</th><th>{t('department')}</th><th>{t('salary')}</th><th>{t('joinDate')}</th><th>{t('location')}</th><th>{t('status')}</th><th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    {w.image_url ? 
                      <img src={w.image_url} width="40" height="40" style={{ borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> 
                      : <FontAwesomeIcon icon={faUser} size="lg" />}
                  </td>
                  <td style={{ padding: '12px' }}>{w.full_name}</td>
                  <td style={{ padding: '12px' }}>{w.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>{w.department_name || '-'}</td>
                  <td style={{ padding: '12px' }}>{w.salary?.toLocaleString() || '-'}</td>
                  <td style={{ padding: '12px' }}>{w.join_date ? new Date(w.join_date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px' }}>{w.location || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: w.is_active ? '#10b981' : '#6b7280', color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                      {w.is_active ? <><FontAwesomeIcon icon={faCheckCircle} /> {t('active')}</> : <><FontAwesomeIcon icon={faTimesCircle} /> {t('inactive')}</>}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => openEdit(w)} style={{ marginRight: '8px', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      <FontAwesomeIcon icon={faEdit} /> {t('edit')}
                    </button>
                    <button onClick={() => handleDeactivate(w.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      <FontAwesomeIcon icon={faTrashAlt} /> {t('delete')}
                    </button>
                    <Link href={`/dashboard/workers/${w.id}`}>
                      <button style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}>
                        <FontAwesomeIcon icon={faEye} /> {t('view')}
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingWorker ? t('editWorker') : t('addWorker')}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder={t('fullName')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="tel" placeholder={t('phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="email" placeholder={t('email')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }}>
                <option value="">{t('selectDepartment')}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" step="0.01" placeholder={t('salary')} value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="date" placeholder={t('joinDate')} value={form.join_date} onChange={e => setForm({ ...form, join_date: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="text" placeholder={t('location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <div style={{ marginBottom: '12px' }}>
                <label>{t('profileImage')}</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && <span><FontAwesomeIcon icon={faUpload} spin /> {t('uploading')}</span>}
                {form.image_url && <img src={form.image_url} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', marginTop: '8px' }} />}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> {t('active')}
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={uploading} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faSave} /> {t('save')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} /> {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}