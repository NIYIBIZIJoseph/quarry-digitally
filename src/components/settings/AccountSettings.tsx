import { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faPhone, faKey, faSave, faShieldAlt, 
  faQrcode, faCamera, faCheckCircle, faCopy, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function AccountSettings() {
  const { t } = useTranslation();
  const [user, setUser] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTwoFactorStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUser({
          name: data.full_name || data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.profile_image || data.avatar_url || '',
        });
      } else {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser({
            name: parsed.fullName || parsed.full_name || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            avatar: parsed.profile_image || parsed.avatar_url || '',
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTwoFactorStatus = async () => {
    try {
      const res = await fetch('/api/user/two-factor/status', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization as string,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Update profile with new image
        const updateRes = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ profile_image: data.url }),
        });
        if (updateRes.ok) {
          setUser({ ...user, avatar: data.url });
          setMessage('Profile picture updated');
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ full_name: user.name, email: user.email, phone: user.phone }),
      });
      if (res.ok) {
        setMessage(t('profileUpdated') || 'Profile updated successfully');
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.fullName = user.name;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      setPasswordMessage(t('passwordChanged') || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMessage('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    setTwoFactorLoading(true);
    setTwoFactorMessage('');
    try {
      const res = await fetch('/api/user/two-factor/setup', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed');
      setTwoFactorSecret(data.secret);
      setTwoFactorQrCode(data.qrCode);
      setBackupCodes(data.backupCodes || []);
      setShow2FAModal(true);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode) {
      setTwoFactorMessage('Please enter verification code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/user/two-factor/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: verificationCode, secret: twoFactorSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setTwoFactorEnabled(true);
      setShow2FAModal(false);
      setTwoFactorMessage('2FA enabled successfully!');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Disable two-factor authentication? This will reduce account security.')) return;
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/user/two-factor/disable', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Disable failed');
      setTwoFactorEnabled(false);
      setTwoFactorMessage('2FA disabled');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } catch (err: any) {
      setTwoFactorMessage(err.message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading') || 'Loading...'}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Profile Header with Avatar */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a4a6e 0%, #0f2b3d 100%)', 
        borderRadius: '16px', 
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: user.avatar ? `url(${user.avatar}) center/cover` : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {!user.avatar && <FontAwesomeIcon icon={faUser} size="3x" style={{ color: 'white' }} />}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
            title="Change profile picture"
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>{user.name}</h2>
        <p style={{ opacity: 0.8, marginBottom: 0 }}>{user.phone}</p>
        {uploading && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Uploading...</p>}
      </div>

      {/* Profile Form */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faUser} /> Profile Information
        </h3>
        
        {message && <div style={{ marginBottom: '1rem', padding: '12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46' }}>{message}</div>}
        {error && <div style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{t('fullName') || 'Full Name'}</label>
            <input
              type="text"
              value={user.name}
              onChange={e => setUser({ ...user, name: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{t('email') || 'Email'}</label>
            <input
              type="email"
              value={user.email}
              onChange={e => setUser({ ...user, email: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{t('phone') || 'Phone'}</label>
            <input
              type="tel"
              value={user.phone}
              onChange={e => setUser({ ...user, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" disabled={saving} style={{ background: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
            </button>
            <button type="button" onClick={() => setShowPasswordModal(true)} style={{ background: '#e5e7eb', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FontAwesomeIcon icon={faKey} /> {t('changePassword') || 'Change Password'}
            </button>
            {!twoFactorEnabled ? (
              <button type="button" onClick={setupTwoFactor} disabled={twoFactorLoading} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FontAwesomeIcon icon={faShieldAlt} /> {twoFactorLoading ? (t('loading') || 'Loading...') : (t('setup2fa') || 'Set up 2FA')}
              </button>
            ) : (
              <button type="button" onClick={disableTwoFactor} disabled={twoFactorLoading} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FontAwesomeIcon icon={faShieldAlt} /> {twoFactorLoading ? (t('loading') || 'Loading...') : (t('disable2fa') || 'Disable 2FA')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2FA Status Card */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FontAwesomeIcon icon={faShieldAlt} /> Two-Factor Authentication
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Add an extra layer of security to your account.
        </p>
        <div style={{ 
          background: twoFactorEnabled ? '#d1fae5' : '#fef3c7', 
          padding: '1rem', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong style={{ color: twoFactorEnabled ? '#065f46' : '#92400e' }}>
              {twoFactorEnabled ? '✅ 2FA is ENABLED' : '⚠️ 2FA is DISABLED'}
            </strong>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0 }}>
              {twoFactorEnabled 
                ? 'Your account is protected with two-factor authentication.' 
                : 'Enable 2FA to add an extra layer of security to your account.'}
            </p>
          </div>
          {!twoFactorEnabled && (
            <button onClick={setupTwoFactor} style={{ background: '#f59e0b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '450px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('changePassword') || 'Change Password'}</h3>
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>{t('currentPassword') || 'Current Password'}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px' }}>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={passwordForm.currentPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                    required 
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', outline: 'none' }} 
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>{t('newPassword') || 'New Password'}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                    required 
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', outline: 'none' }} 
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>{t('confirmPassword') || 'Confirm Password'}</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
              </div>
              {passwordError && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordError}</div>}
              {passwordMessage && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem' }}>{passwordMessage}</div>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t('cancel') || 'Cancel'}</button>
                <button type="submit" disabled={passwordLoading} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{passwordLoading ? (t('saving') || 'Saving...') : (t('update') || 'Update')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && twoFactorSecret && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShow2FAModal(false)}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('setup2fa') || 'Set up Two-Factor Authentication'}</h3>
            <p>Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).</p>
            {twoFactorQrCode && (
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <img src={twoFactorQrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
              </div>
            )}
            <p><strong>Or enter this secret manually:</strong></p>
            <code style={{ display: 'block', background: '#f3f4f6', padding: '8px', borderRadius: '6px', wordBreak: 'break-all', marginBottom: '1rem' }}>{twoFactorSecret}</code>
            {backupCodes.length > 0 && (
              <>
                <p><strong>Backup codes (save these somewhere safe):</strong></p>
                <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '6px', marginBottom: '1rem', position: 'relative' }}>
                  {backupCodes.map((code, i) => <div key={i} style={{ fontFamily: 'monospace', fontSize: '14px' }}>{code}</div>)}
                  <button onClick={copyBackupCodes} style={{ position: 'absolute', top: '8px', right: '8px', background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>{t('verificationCode') || 'Verification Code'}</label>
              <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="000000" maxLength={6} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
            </div>
            {twoFactorMessage && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{twoFactorMessage}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShow2FAModal(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t('cancel') || 'Cancel'}</button>
              <button type="button" onClick={verifyTwoFactor} disabled={twoFactorLoading} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{twoFactorLoading ? (t('verifying') || 'Verifying...') : (t('verifyAndEnable') || 'Verify & Enable')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}