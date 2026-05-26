import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faFileExport, faPrint, faUser, faPhoneAlt, faBuilding 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Department {
  id: number;
  name: string;
}

interface SimpleWorker {
  id: number;
  full_name: string;
  phone: string;
  department_id: number;
  department_name: string;
}

export default function GeneralWorkersList() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<SimpleWorker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<SimpleWorker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch workers');
      const data = await res.json();
      const mapped = data.map((w: any) => ({
        id: w.id,
        full_name: w.full_name,
        phone: w.phone,
        department_id: w.department_id,
        department_name: w.department_name,
      }));
      setWorkers(mapped);
      applyFilters(mapped, searchTerm, departmentFilter);
    } catch (err: any) {
      setError(err.message);
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

  const applyFilters = (workersList: SimpleWorker[], search: string, deptId: string) => {
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

  const exportToCSV = () => {
    const headers = [t('name'), t('phone'), t('department')];
    const rows = filteredWorkers.map(w => [w.full_name, w.phone || '', w.department_name || '']);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers_general.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Workers General List</title></head>
        <body>
          <h1>Workers List</h1>
          <table border="1" cellpadding="8">
            <thead><tr><th>${t('name')}</th><th>${t('phone')}</th><th>${t('department')}</th></tr></thead>
            <tbody>
              ${filteredWorkers.map(w => `<tr><td>${escapeHtml(w.full_name)}</td><td>${escapeHtml(w.phone || '-')}</td><td>${escapeHtml(w.department_name || '-')}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const escapeHtml = (str: string) => str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });

  if (loading) return <DashboardLayout><p>{t('loading')}</p></DashboardLayout>;
  if (error) return <DashboardLayout><p>{t('error')}: {error}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('generalLists')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV')}
          </button>
          <button onClick={printList} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPrint} /> {t('printPDF')}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={t('searchByNamePhone')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '8px 8px 8px 32px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
        >
          <option value="all">{t('allDepartments')}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {filteredWorkers.length === 0 ? (
        <p>{t('noWorkersMatching')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}><FontAwesomeIcon icon={faUser} /> {t('name')}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}><FontAwesomeIcon icon={faPhoneAlt} /> {t('phone')}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}><FontAwesomeIcon icon={faBuilding} /> {t('department')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{w.full_name}</td>
                  <td style={{ padding: '12px' }}>{w.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>{w.department_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}