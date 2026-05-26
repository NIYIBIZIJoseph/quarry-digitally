import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
// DELETE this line:
// import { getAuthHeaders } from '@/lib/auth';

// ADD this right after the imports (before the component):
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', avatar_url: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchProfile = async () => {
    const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
    const data = await res.json();
    setProfile(data);
    setForm({
      full_name: data.full_name || '',
      phone: data.phone || '',
      email: data.email || '',
      avatar_url: data.avatar_url || '',
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
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
      if (res.ok) {
        setForm({ ...form, avatar_url: data.url });
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage({ text: 'Profile updated successfully', type: 'success' });
      fetchProfile();
    } else {
      setMessage({ text: 'Update failed', type: 'error' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      }),
    });
    if (res.ok) {
      setMessage({ text: 'Password changed successfully', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } else {
      const err = await res.json();
      setMessage({ text: err.message || 'Password change failed', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>My Profile</h1>

      {message.text && (
        <div style={{ background: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Profile Information */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2>Profile Information</h2>
          <form onSubmit={updateProfile}>
            <div style={{ marginBottom: '12px' }}>
              <label>Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>Profile Picture</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '8px' }} />
              {uploading && <span>Uploading...</span>}
              {form.avatar_url && (
                <div>
                  <img src={form.avatar_url} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginTop: '8px' }} />
                  <input type="text" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} placeholder="Or enter image URL" style={{ width: '100%', marginTop: '8px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              )}
            </div>
            <button type="submit" disabled={saving || uploading} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2>Change Password</h2>
          <form onSubmit={changePassword}>
            <div style={{ marginBottom: '12px' }}>
              <label>Current Password</label>
              <input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>New Password</label>
              <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label>Confirm New Password</label>
              <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <button type="submit" style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Change Password</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}