import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function TeamManagementSettings() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    const res = await fetch('/api/team-members', { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setForm({ ...form, image_url: data.url });
      else alert(data.message || t('uploadFailed') || 'Upload failed');
    } catch (err) {
      alert(t('networkError') || 'Network error');
    } finally {
      setUploading(false);
    }
  };

  const saveMember = async () => {
    if (!form.name || !form.role) {
      alert(t('nameAndRoleRequired') || 'Name and role are required');
      return;
    }
    const url = editing ? `/api/team-members/${editing.id}` : '/api/team-members';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage(editing ? t('memberUpdated') || 'Member updated' : t('memberAdded') || 'Member added');
      setEditing(null);
      setForm({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true });
      fetchMembers();
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert(t('saveFailed') || 'Save failed');
    }
  };

  const deleteMember = async (id: number) => {
    if (!confirm(t('confirmDeleteTeamMember') || 'Delete this team member?')) return;
    const res = await fetch(`/api/team-members/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) fetchMembers();
  };

  if (loading) return <div>{t('loadingTeamMembers') || 'Loading team members...'}</div>;

  return (
    <div>
      <h3>{t('teamManagement') || 'Team Management'}</h3>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h4>{editing ? t('editMember') || 'Edit Member' : t('addNewMember') || 'Add New Member'}</h4>
        <input
          type="text"
          placeholder={t('name') || 'Name'}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          placeholder={t('rolePlaceholder') || "Role (e.g., 'Operations Manager')"}
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <textarea
          placeholder={t('shortBio') || 'Short bio'}
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          rows={3}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <div>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <span>{t('uploading') || 'Uploading...'}</span>}
          {form.image_url && <img src={form.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '8px', borderRadius: '8px' }} />}
          <input
            type="text"
            placeholder={t('orImageUrl') || 'Or image URL'}
            value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
            style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <input
          type="number"
          placeholder={t('sortOrder') || 'Sort order (lower = earlier)'}
          value={form.sort_order}
          onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          {t('activeShowOnWebsite') || 'Active (show on website)'}
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={saveMember} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            {editing ? t('update') || 'Update' : t('add') || 'Add'} {t('member') || 'Member'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', role: '', bio: '', image_url: '', sort_order: 0, is_active: true }); }} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              {t('cancel') || 'Cancel'}
            </button>
          )}
        </div>
        {message && <div style={{ marginTop: '1rem', padding: '8px', background: '#d1fae5', borderRadius: '6px' }}>{message}</div>}
      </div>

      <h4>{t('existingTeamMembers') || 'Existing Team Members'}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {members.map(m => (
          <div key={m.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {m.image_url && <img src={m.image_url} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />}
            <h4>{m.name}</h4>
            <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>{m.role}</p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{m.bio}</p>
            <p>{t('sort') || 'Sort'}: {m.sort_order} | {m.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}</p>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setEditing(m); setForm(m); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('edit') || 'Edit'}</button>
              <button onClick={() => deleteMember(m.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('delete') || 'Delete'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}