import { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewTicket() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({
    user_name: '',
    phone: '',
    category: '',
    priority: 'medium',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(t('failedToCreateTicket') || 'Failed to create ticket');
      const data = await res.json();
      router.push(`/dashboard/support/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('createNewTicket') || 'Create New Support Ticket'}</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('name') || 'Name'} *</label>
          <input type="text" name="user_name" required value={form.user_name} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('phone') || 'Phone'}</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('category') || 'Category'}</label>
          <input type="text" name="category" value={form.category} onChange={handleChange} placeholder={t('categoryPlaceholder') || 'e.g., Login, Attendance, Billing'} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('priority') || 'Priority'}</label>
          <select name="priority" value={form.priority} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
            <option value="low">{t('priorityLow') || 'Low'}</option>
            <option value="medium">{t('priorityMedium') || 'Medium'}</option>
            <option value="high">{t('priorityHigh') || 'High'}</option>
            <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('subject') || 'Subject'} *</label>
          <input type="text" name="subject" required value={form.subject} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>{t('message') || 'Message'} *</label>
          <textarea name="message" rows={5} required value={form.message} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.push('/dashboard/support')} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}
          </button>
          <button type="submit" disabled={loading} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faSave} /> {loading ? (t('creating') || 'Creating...') : (t('createTicket') || 'Create Ticket')}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}