import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faKey, faBuilding, faClock, faChartLine, faBoxes,
  faHeadset, faBell, faShieldAlt, faDatabase, faPalette, faCrown,
  faCamera, faUsers, faHistory
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';
import RolesPermissions from '@/components/settings/RolesPermissions';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import AttendanceRules from '@/components/settings/AttendanceRules';
import AnalyticsConfigSettings from '@/components/settings/AnalyticsConfig';
import InventoryConfigSettings from '@/components/settings/InventoryConfig';
import SupportConfigSettings from '@/components/settings/SupportConfigSettings';
import NotificationsConfigSettings from '@/components/settings/NotificationsSettings';
import SecurityConfigSettings from '@/components/settings/SecuritySettings';
import DataManagementSettings from '@/components/settings/DataManagement';
import UIPreferencesSettings from '@/components/settings/UIPreferences';
import AdminControlsSettings from '@/components/settings/AdminControls';
import TeamManagementSettings from '@/components/settings/TeamManagementSettings';
import AuditLogs from '@/components/settings/AuditLogs';

// ==================== Account Settings Component ====================
function AccountSettings() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    id: 0,
    full_name: '',
    phone: '',
    email: '',
    profile_image: '',
    two_factor_enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQr, setTwoFactorQr] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorMessage, setTwoFactorMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await fetch('/api/user/profile', { headers: getAuthHeaders() });
    const data = await res.json();
    setProfile(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    const fd = new FormData();
    fd.append('image', selectedFile);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) return data.url;
      throw new Error(data.message || 'Upload failed');
    } catch (err) {
      alert(t('uploadFailed') || 'Image upload failed');
      return null;
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    let imageUrl = profile.profile_image;
    if (selectedFile) {
      const uploaded = await uploadImage();
      if (uploaded) imageUrl = uploaded;
    }
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        profile_image: imageUrl,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfileMessage(t('profileUpdated') || 'Profile updated successfully');
      setSelectedFile(null);
      fetchProfile();
      setTimeout(() => setProfileMessage(''), 3000);
    } else {
      alert(data.error || t('updateFailed') || 'Update failed');
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage(t('passwordsDoNotMatch') || 'New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPasswordMessage(t('passwordChanged') || 'Password changed successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordMessage(data.error || t('changeFailed') || 'Change failed');
    }
    setChangingPassword(false);
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const start2faSetup = async () => {
    const res = await fetch('/api/user/two-factor/setup', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setTwoFactorSecret(data.secret);
      setTwoFactorQr(data.qrCode);
      setShow2faSetup(true);
    } else {
      alert(data.error || t('twoFactorSetupFailed') || 'Failed to start 2FA setup');
    }
  };

  const verifyAndEnable2fa = async () => {
    if (!verificationCode) return;
    const res = await fetch('/api/user/two-factor/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ secret: twoFactorSecret, token: verificationCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setBackupCodes(data.backupCodes);
      setTwoFactorMessage(t('twoFactorEnabled') || '2FA enabled! Save your backup codes.');
      setProfile((prev) => ({ ...prev, two_factor_enabled: true }));
      setShow2faSetup(false);
      setTimeout(() => setTwoFactorMessage(''), 5000);
    } else {
      setTwoFactorMessage(data.error || t('verificationFailed') || 'Verification failed');
    }
  };

  const disable2fa = async () => {
    if (!confirm(t('confirmDisable2fa') || 'Disable two‑factor authentication? This will reduce account security.')) return;
    const res = await fetch('/api/user/two-factor/disable', { method: 'POST', headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setProfile((prev) => ({ ...prev, two_factor_enabled: false }));
      setTwoFactorMessage(t('twoFactorDisabled') || '2FA disabled');
      setTimeout(() => setTwoFactorMessage(''), 3000);
    } else {
      alert(data.error || t('disableFailed') || 'Failed to disable 2FA');
    }
  };

  return (
    <div>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3>{t('profilePicture') || 'Profile Picture'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <img
            src={profile.profile_image || '/default-avatar.png'}
            alt="Profile"
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
          />
          <div>
            <label style={{ display: 'inline-block', background: '#f59e0b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}>
              <FontAwesomeIcon icon={faCamera} /> {t('chooseFile') || 'Choose File'}
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            {selectedFile && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{selectedFile.name}</span>}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3>{t('profileInformation') || 'Profile Information'}</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>{t('fullName') || 'Full Name'}</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={e => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>{t('phone') || 'Phone'}</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>{t('emailOptional') || 'Email (optional)'}</label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
        </button>
        {profileMessage && <p style={{ marginTop: '12px', color: '#10b981' }}>{profileMessage}</p>}
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h3>{t('changePassword') || 'Change Password'}</h3>
        <input
          type="password"
          placeholder={t('currentPassword') || 'Current Password'}
          value={passwordForm.oldPassword}
          onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <input
          type="password"
          placeholder={t('newPassword') || 'New Password'}
          value={passwordForm.newPassword}
          onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <input
          type="password"
          placeholder={t('confirmNewPassword') || 'Confirm New Password'}
          value={passwordForm.confirmPassword}
          onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <button
          onClick={changePassword}
          disabled={changingPassword}
          style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          {changingPassword ? (t('changing') || 'Changing...') : (t('changePassword') || 'Change Password')}
        </button>
        {passwordMessage && <p style={{ marginTop: '12px', color: passwordMessage.includes('success') ? '#10b981' : '#dc2626' }}>{passwordMessage}</p>}
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <h3>{t('twoFactorAuth') || 'Two‑Factor Authentication (2FA)'}</h3>
        {!profile.two_factor_enabled ? (
          <>
            <p>{t('twoFactorDescription') || 'Add an extra layer of security to your account.'}</p>
            {!show2faSetup ? (
              <button onClick={start2faSetup} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                {t('setup2fa') || 'Set up 2FA'}
              </button>
            ) : (
              <div>
                <p>{t('scanQrCode') || 'Scan the QR code with your authenticator app.'}</p>
                <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                  <img src={twoFactorQr} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
                <p>{t('manualSecret') || 'Manual secret'}: <code>{twoFactorSecret}</code></p>
                <input
                  type="text"
                  placeholder={t('enterSixDigitCode') || 'Enter 6‑digit code'}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px' }}
                />
                <button onClick={verifyAndEnable2fa} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  {t('verifyAndEnable') || 'Verify & Enable'}
                </button>
                <button onClick={() => setShow2faSetup(false)} style={{ marginLeft: '8px', background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  {t('cancel') || 'Cancel'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div>
            <p>{t('twoFactorEnabled') || 'Two‑factor authentication is'} <strong style={{ color: '#10b981' }}>{t('enabled') || 'enabled'}</strong>.</p>
            {backupCodes.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p><strong>{t('backupCodesStoreSafely') || 'Backup codes (store safely)'}:</strong></p>
                <ul>
                  {backupCodes.map((code, idx) => <li key={idx}>{code}</li>)}
                </ul>
              </div>
            )}
            <button onClick={disable2fa} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              {t('disable2fa') || 'Disable 2FA'}
            </button>
          </div>
        )}
        {twoFactorMessage && <p style={{ marginTop: '12px', color: '#f59e0b' }}>{twoFactorMessage}</p>}
      </div>
    </div>
  );
}

// ==================== Main Settings Page ====================
export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState('account');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
  }, []);

  const tabs = [
    { id: 'account', label: t('account') || 'Account', icon: faUser, roles: ['superadmin', 'admin', 'service_provider', 'supervisor'] },
    { id: 'roles', label: t('rolesPermissions') || 'Roles & Permissions', icon: faKey, roles: ['superadmin'] },
    { id: 'organization', label: t('organization') || 'Organization', icon: faBuilding, roles: ['superadmin', 'admin'] },
    { id: 'attendance', label: t('attendanceRules') || 'Attendance Rules', icon: faClock, roles: ['superadmin', 'admin'] },
    { id: 'analytics', label: t('analyticsConfig') || 'Analytics Config', icon: faChartLine, roles: ['superadmin', 'admin'] },
    { id: 'inventory', label: t('inventoryConfig') || 'Inventory Config', icon: faBoxes, roles: ['superadmin', 'admin'] },
    { id: 'support', label: t('supportConfig') || 'Support Config', icon: faHeadset, roles: ['superadmin', 'admin'] },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: faBell, roles: ['superadmin', 'admin', 'service_provider', 'supervisor'] },
    { id: 'security', label: t('security') || 'Security', icon: faShieldAlt, roles: ['superadmin', 'admin'] },
    { id: 'data', label: t('dataManagement') || 'Data Management', icon: faDatabase, roles: ['superadmin', 'admin'] },
    { id: 'ui', label: t('uiPreferences') || 'UI Preferences', icon: faPalette, roles: ['superadmin', 'admin', 'service_provider', 'supervisor'] },
    { id: 'admin', label: t('adminControls') || 'Admin Controls', icon: faCrown, roles: ['superadmin'] },
    { id: 'team', label: t('teamManagement') || 'Team Management', icon: faUsers, roles: ['superadmin', 'admin'] },
    { id: 'audit', label: t('auditLogs') || 'Audit Logs', icon: faHistory, roles: ['superadmin', 'admin'] },
  ];

  const visibleTabs = tabs.filter(tab => userRole && tab.roles.includes(userRole));

  useEffect(() => {
    if (userRole && visibleTabs.length > 0) {
      let targetTab = activeTab;
      if (tab && typeof tab === 'string' && visibleTabs.some(t => t.id === tab)) {
        targetTab = tab;
      }
      if (!visibleTabs.some(t => t.id === targetTab)) {
        targetTab = visibleTabs[0].id;
      }
      setActiveTab(targetTab);
    }
  }, [userRole, tab, visibleTabs]);

  const renderTab = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings />;
      case 'roles': return <RolesPermissions />;
      case 'organization': return <OrganizationSettings />;
      case 'attendance': return <AttendanceRules />;
      case 'analytics': return <AnalyticsConfigSettings />;
      case 'inventory': return <InventoryConfigSettings />;
      case 'support': return <SupportConfigSettings />;
      case 'notifications': return <NotificationsConfigSettings />;
      case 'security': return <SecurityConfigSettings />;
      case 'data': return <DataManagementSettings />;
      case 'ui': return <UIPreferencesSettings />;
      case 'admin': return <AdminControlsSettings />;
      case 'team': return <TeamManagementSettings />;
      case 'audit': return <AuditLogs />;
      default: return <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>{t('comingSoon') || 'Coming soon.'}</div>;
    }
  };

  if (!userRole) return <DashboardLayout>{t('loading') || 'Loading...'}</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('settings') || 'Settings'}</h1>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        {visibleTabs.map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tabItem.id ? 'bold' : 'normal',
              borderBottom: activeTab === tabItem.id ? '2px solid #f59e0b' : 'none',
              color: activeTab === tabItem.id ? '#f59e0b' : '#4b5563',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FontAwesomeIcon icon={tabItem.icon} /> {tabItem.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </DashboardLayout>
  );
}