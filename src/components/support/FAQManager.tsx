import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export default function FAQManager() {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: '', sort_order: 0 });

  const fetchFAQs = async () => {
    const res = await fetch('/api/faq', { headers: getAuthHeaders() });
    const data = await res.json();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => { fetchFAQs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch('/api/faq', { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
    if (res.ok) {
      setEditing(null);
      setForm({ question: '', answer: '', category: '', sort_order: 0 });
      fetchFAQs();
    } else alert(t('failedToSaveFaq') || 'Failed to save FAQ');
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteFaq') || 'Delete this FAQ?')) return;
    await fetch(`/api/faq?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchFAQs();
  };

  if (loading) return <div>{t('loadingFaqs') || 'Loading FAQs...'}</div>;

  return (
    <div>
      <h2>{t('manageFaqs') || 'Manage FAQs'}</h2>
      <form onSubmit={handleSubmit} style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
        <input type="text" placeholder={t('question') || 'Question'} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        <textarea placeholder={t('answer') || 'Answer'} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} required rows={3} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
        <input type="text" placeholder={t('categoryOptional') || 'Category (optional)'} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px' }} />
        <input type="number" placeholder={t('sortOrder') || 'Sort order'} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px' }} />
        <button type="submit" style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={editing ? faSave : faPlus} /> {editing ? (t('update') || 'Update') : (t('create') || 'Create')} FAQ
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ question: '', answer: '', category: '', sort_order: 0 }); }} style={{ marginLeft: '8px', background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}><FontAwesomeIcon icon={faTimes} /> {t('cancel') || 'Cancel'}</button>}
      </form>
      {faqs.map(faq => (
        <div key={faq.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{faq.question}</strong>
            <div>
              <button onClick={() => { setEditing(faq); setForm({ question: faq.question, answer: faq.answer, category: faq.category || '', sort_order: faq.sort_order }); }} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faEdit} /> {t('edit') || 'Edit'}
              </button>
              <button onClick={() => handleDelete(faq.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: '8px', color: '#4b5563' }}>{faq.answer}</div>
          {faq.category && <small>{t('category')}: {faq.category}</small>}
        </div>
      ))}
    </div>
  );
}