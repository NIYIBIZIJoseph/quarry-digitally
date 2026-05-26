import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faUser, faPhoneAlt, faEnvelope, faBuilding, faMoneyBillWave,
  faCalendarAlt, faMapMarkerAlt, faCheckCircle, faTimesCircle, faFileAlt,
  faUmbrellaBeach, faStar, faChartLine, faEdit, faTrashAlt, faSave, faTimes,
  faUpload, faPrint, faHistory, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Worker {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  department_name?: string;
  salary: number;
  join_date: string;
  location: string;
  image_url: string;
  is_active: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: string;
  status_reason: string;
}

interface SalaryRecord {
  id: number;
  old_salary: number;
  new_salary: number;
  effective_date: string;
  reason: string;
}

interface Document {
  id: number;
  type: string;
  title: string;
  file_url: string;
  uploaded_at: string;
}

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface PerformanceReview {
  id: number;
  review_date: string;
  reviewer: string;
  rating: number;
  comments: string;
}

interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
}

export default function WorkerDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const id = router.query.id as string;
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSalary, setNewSalary] = useState({ new_salary: '', effective_date: '', reason: '' });
  const [newDocument, setNewDocument] = useState({ type: 'contract', title: '', file_url: '' });
  const [newLeave, setNewLeave] = useState({ start_date: '', end_date: '', reason: '' });
  const [newReview, setNewReview] = useState({ review_date: '', reviewer: '', rating: 3, comments: '' });

  const fetchWorker = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/workers/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch worker');
      const data = await res.json();
      setWorker(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSalaryHistory = async () => {
    if (!id) return;
    const res = await fetch(`/api/workers/${id}/salary-history`, { headers: getAuthHeaders() });
    const data = await res.json();
    setSalaryHistory(Array.isArray(data) ? data : []);
  };

  const fetchDocuments = async () => {
    if (!id) return;
    const res = await fetch(`/api/workers/${id}/documents`, { headers: getAuthHeaders() });
    const data = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
  };

  const fetchLeaveRequests = async () => {
    if (!id) return;
    const res = await fetch(`/api/workers/${id}/leave-requests`, { headers: getAuthHeaders() });
    const data = await res.json();
    setLeaveRequests(Array.isArray(data) ? data : []);
  };

  const fetchPerformanceReviews = async () => {
    if (!id) return;
    const res = await fetch(`/api/workers/${id}/performance-reviews`, { headers: getAuthHeaders() });
    const data = await res.json();
    setPerformanceReviews(Array.isArray(data) ? data : []);
  };

  const fetchAttendanceSummary = async () => {
    if (!id) return;
    const res = await fetch(`/api/workers/${id}/attendance-summary`, { headers: getAuthHeaders() });
    const data = await res.json();
    setAttendanceSummary(data);
  };

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchWorker(),
        fetchSalaryHistory(),
        fetchDocuments(),
        fetchLeaveRequests(),
        fetchPerformanceReviews(),
        fetchAttendanceSummary(),
      ]).finally(() => setLoading(false));
    }
  }, [id]);

  const addSalaryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalary.new_salary || !newSalary.effective_date) return;
    const res = await fetch(`/api/workers/${id}/salary-history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        old_salary: worker?.salary,
        new_salary: parseFloat(newSalary.new_salary),
        effective_date: newSalary.effective_date,
        reason: newSalary.reason,
      }),
    });
    if (res.ok) {
      setNewSalary({ new_salary: '', effective_date: '', reason: '' });
      await fetchSalaryHistory();
      await fetchWorker();
    } else {
      alert(t('failedToAddSalaryRecord') || 'Failed to add salary record');
    }
  };

  const addDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.file_url) return;
    const res = await fetch(`/api/workers/${id}/documents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newDocument),
    });
    if (res.ok) {
      setNewDocument({ type: 'contract', title: '', file_url: '' });
      await fetchDocuments();
    } else {
      alert(t('failedToAddDocument') || 'Failed to add document');
    }
  };

  const deleteDocument = async (docId: number) => {
    if (!confirm(t('confirmDeleteDocument') || 'Delete this document?')) return;
    const res = await fetch(`/api/workers/${id}/documents`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ docId }),
    });
    if (res.ok) await fetchDocuments();
  };

  const addLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.start_date || !newLeave.end_date) return;
    const res = await fetch(`/api/workers/${id}/leave-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newLeave),
    });
    if (res.ok) {
      setNewLeave({ start_date: '', end_date: '', reason: '' });
      await fetchLeaveRequests();
    } else {
      alert(t('failedToAddLeaveRequest') || 'Failed to add leave request');
    }
  };

  const updateLeaveStatus = async (leaveId: number, status: string) => {
    const res = await fetch(`/api/workers/${id}/leave-requests`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leave_id: leaveId, status }),
    });
    if (res.ok) await fetchLeaveRequests();
  };

  const addPerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.review_date || !newReview.rating) return;
    const res = await fetch(`/api/workers/${id}/performance-reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newReview),
    });
    if (res.ok) {
      setNewReview({ review_date: '', reviewer: '', rating: 3, comments: '' });
      await fetchPerformanceReviews();
    } else {
      alert(t('failedToAddReview') || 'Failed to add review');
    }
  };

  if (loading) return <DashboardLayout><p>{t('loadingWorkerDetails') || 'Loading worker details...'}</p></DashboardLayout>;
  if (error || !worker) return <DashboardLayout><p>{t('error') || 'Error'}: {error || (t('workerNotFound') || 'Worker not found')}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>{worker.full_name}</h1>
        <button onClick={() => router.push('/dashboard/workers')} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('backToWorkers') || 'Back to Workers'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        {['basic', 'salary', 'documents', 'leave', 'reviews', 'attendance'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === tab ? 'bold' : 'normal',
            borderBottom: activeTab === tab ? '2px solid #f59e0b' : 'none',
            color: activeTab === tab ? '#f59e0b' : '#4b5563',
          }}>
            {t(tab) || tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <img src={worker.image_url || '/default-avatar.png'} alt="Avatar" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 2 }}>
              <p><strong><FontAwesomeIcon icon={faUser} /> {t('fullName') || 'Full Name'}:</strong> {worker.full_name}</p>
              <p><strong><FontAwesomeIcon icon={faPhoneAlt} /> {t('phone') || 'Phone'}:</strong> {worker.phone || '-'}</p>
              <p><strong><FontAwesomeIcon icon={faEnvelope} /> {t('email') || 'Email'}:</strong> {worker.email || '-'}</p>
              <p><strong><FontAwesomeIcon icon={faBuilding} /> {t('department') || 'Department'}:</strong> {worker.department_name || '-'}</p>
              <p><strong><FontAwesomeIcon icon={faMoneyBillWave} /> {t('salary') || 'Salary'}:</strong> {worker.salary?.toLocaleString()} RWF</p>
              <p><strong><FontAwesomeIcon icon={faCalendarAlt} /> {t('joinDate') || 'Join Date'}:</strong> {worker.join_date ? new Date(worker.join_date).toLocaleDateString() : '-'}</p>
              <p><strong><FontAwesomeIcon icon={faMapMarkerAlt} /> {t('location') || 'Location'}:</strong> {worker.location || '-'}</p>
              <p><strong>{t('status') || 'Status'}:</strong> <span style={{ background: worker.is_active ? '#10b981' : '#6b7280', color: 'white', padding: '4px 8px', borderRadius: '20px' }}>
                {worker.is_active ? <><FontAwesomeIcon icon={faCheckCircle} /> {t('active') || 'Active'}</> : <><FontAwesomeIcon icon={faTimesCircle} /> {t('inactive') || 'Inactive'}</>}
              </span></p>
              <p><strong>{t('employmentStatus') || 'Employment Status'}:</strong> {worker.status} {worker.status_reason && `(${worker.status_reason})`}</p>
              <p><strong>{t('emergencyContact') || 'Emergency Contact'}:</strong> {worker.emergency_contact_name || '-'} / {worker.emergency_contact_phone || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Salary History Tab */}
      {activeTab === 'salary' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>{t('salaryHistory') || 'Salary History'}</h2>
          <form onSubmit={addSalaryRecord} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <input type="number" placeholder={t('newSalary') || 'New Salary (RWF)'} value={newSalary.new_salary} onChange={e => setNewSalary({ ...newSalary, new_salary: e.target.value })} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="date" value={newSalary.effective_date} onChange={e => setNewSalary({ ...newSalary, effective_date: e.target.value })} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="text" placeholder={t('reason') || 'Reason'} value={newSalary.reason} onChange={e => setNewSalary({ ...newSalary, reason: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button type="submit" style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faSave} /> {t('addRecord') || 'Add Record'}
            </button>
          </form>
          {salaryHistory.length === 0 ? <p>{t('noSalaryHistory') || 'No salary history.'}</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>{t('date') || 'Date'}</th><th>{t('oldSalary') || 'Old Salary'}</th><th>{t('newSalaryValue') || 'New Salary'}</th><th>{t('reason') || 'Reason'}</th></tr>
              </thead>
              <tbody>
                {salaryHistory.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.effective_date).toLocaleDateString()}</td>
                    <td>{s.old_salary?.toLocaleString()}</td>
                    <td>{s.new_salary.toLocaleString()}</td>
                    <td>{s.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>{t('documents') || 'Documents'}</h2>
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
            <h3>{t('addDocument') || 'Add New Document'}</h3>
            <div style={{ marginBottom: '12px' }}>
              <label>{t('documentType') || 'Document Type'}</label>
              <select value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="contract">{t('contract') || 'Contract'}</option>
                <option value="id_card">{t('idCard') || 'ID Card'}</option>
                <option value="certificate">{t('certificate') || 'Certificate'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>{t('title') || 'Title (optional)'}</label>
              <input type="text" value={newDocument.title} onChange={e => setNewDocument({ ...newDocument, title: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>{t('uploadFile') || 'Upload File (PDF, JPG, PNG)'}</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const fd = new FormData();
                fd.append('image', file);
                try {
                  const res = await fetch('/api/upload', { method: 'POST', body: fd });
                  const data = await res.json();
                  if (res.ok) {
                    setNewDocument({ ...newDocument, file_url: data.url });
                  } else {
                    alert(t('uploadFailed') || 'Upload failed');
                  }
                } catch (err) {
                  alert(t('uploadError') || 'Upload error');
                } finally {
                  setUploading(false);
                }
              }} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              {newDocument.file_url && (
                <div style={{ marginTop: '8px', color: '#10b981' }}>
                  <FontAwesomeIcon icon={faCheckCircle} /> {t('fileReady') || 'File ready'}: {newDocument.file_url.split('/').pop()}
                </div>
              )}
            </div>
            <button onClick={addDocument} disabled={!newDocument.file_url || uploading} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              {uploading ? <><FontAwesomeIcon icon={faUpload} spin /> {t('uploading') || 'Uploading...'}</> : <><FontAwesomeIcon icon={faSave} /> {t('addDocument') || 'Add Document'}</>}
            </button>
          </div>

          {documents.length === 0 ? <p>{t('noDocuments') || 'No documents.'}</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>{t('documentType') || 'Type'}</th><th>{t('title') || 'Title'}</th><th>{t('file') || 'File'}</th><th>{t('uploadedAt') || 'Uploaded'}</th><th></th></tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id}>
                    <td>{d.type}</td>
                    <td>{d.title || '-'}</td>
                    <td><a href={d.file_url} target="_blank" rel="noreferrer">{t('view') || 'View'}</a></td>
                    <td>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    <td><button onClick={() => deleteDocument(d.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}><FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'leave' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>{t('leaveRequests') || 'Leave Requests'}</h2>
          <form onSubmit={addLeaveRequest} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <input type="date" placeholder={t('startDate') || 'Start Date'} value={newLeave.start_date} onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="date" placeholder={t('endDate') || 'End Date'} value={newLeave.end_date} onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="text" placeholder={t('reason') || 'Reason'} value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button type="submit" style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faSave} /> {t('requestLeave') || 'Request Leave'}
            </button>
          </form>
          {leaveRequests.length === 0 ? <p>{t('noLeaveRequests') || 'No leave requests.'}</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>{t('startDate') || 'Start'}</th><th>{t('endDate') || 'End'}</th><th>{t('reason') || 'Reason'}</th><th>{t('status') || 'Status'}</th><th>{t('actions') || 'Actions'}</th></tr>
              </thead>
              <tbody>
                {leaveRequests.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.start_date).toLocaleDateString()}</td>
                    <td>{new Date(l.end_date).toLocaleDateString()}</td>
                    <td>{l.reason || '-'}</td>
                    <td>{l.status}</td>
                    <td>
                      {l.status === 'pending' && (
                        <>
                          <button onClick={() => updateLeaveStatus(l.id, 'approved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', marginRight: '4px', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faCheckCircle} /> {t('approve') || 'Approve'}
                          </button>
                          <button onClick={() => updateLeaveStatus(l.id, 'rejected')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faTimesCircle} /> {t('reject') || 'Reject'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Performance Reviews Tab */}
      {activeTab === 'reviews' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>{t('performanceReviews') || 'Performance Reviews'}</h2>
          <form onSubmit={addPerformanceReview} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <input type="date" value={newReview.review_date} onChange={e => setNewReview({ ...newReview, review_date: e.target.value })} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="text" placeholder={t('reviewer') || 'Reviewer'} value={newReview.reviewer} onChange={e => setNewReview({ ...newReview, reviewer: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: parseInt(e.target.value) })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
            </select>
            <input type="text" placeholder={t('comments') || 'Comments'} value={newReview.comments} onChange={e => setNewReview({ ...newReview, comments: e.target.value })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button type="submit" style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faSave} /> {t('addReview') || 'Add Review'}
            </button>
          </form>
          {performanceReviews.length === 0 ? <p>{t('noPerformanceReviews') || 'No performance reviews.'}</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>{t('date') || 'Date'}</th><th>{t('reviewer') || 'Reviewer'}</th><th>{t('rating') || 'Rating'}</th><th>{t('comments') || 'Comments'}</th></tr>
              </thead>
              <tbody>
                {performanceReviews.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.review_date).toLocaleDateString()}</td>
                    <td>{r.reviewer || '-'}</td>
                    <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                    <td>{r.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Attendance Summary Tab */}
      {activeTab === 'attendance' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <h2>{t('attendanceSummary') || 'Attendance Summary (Current Month)'}</h2>
          {attendanceSummary ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faCalendarAlt} /> <strong>{t('totalDays') || 'Total Days'}</strong><br />{attendanceSummary.total_days}
              </div>
              <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faCheckCircle} /> <strong>{t('present') || 'Present'}</strong><br />{attendanceSummary.present_days}
              </div>
              <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faTimesCircle} /> <strong>{t('absent') || 'Absent'}</strong><br />{attendanceSummary.absent_days}
              </div>
              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} /> <strong>{t('late') || 'Late'}</strong><br />{attendanceSummary.late_days}
              </div>
            </div>
          ) : <p>{t('noAttendanceData') || 'No attendance data for this month.'}</p>}
        </div>
      )}
    </DashboardLayout>
  );
}