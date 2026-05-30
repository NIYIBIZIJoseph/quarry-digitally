import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserRoleFromToken } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faKey, faBuilding, faClock, faChartLine, faBoxes,
  faHeadset, faBell, faShieldAlt, faDatabase, faPalette, faCrown,
  faUsers, faHistory, faSlidersH, faLock, faEnvelope, faPhone,
  faGlobe, faPaintBrush, faCodeBranch
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';
import AccountSettings from '@/components/settings/AccountSettings';
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

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tab } = router.query;

  const [activeTab, setActiveTab] = useState('account');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role || null);
  }, []);

  // Define all tabs with their required roles
  const allTabs = [
    { id: 'account', label: t('account') || 'Account', icon: faUser, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER], description: 'Manage your profile, password, and 2FA' },
    { id: 'roles', label: t('rolesPermissions') || 'Roles & Permissions', icon: faKey, roles: [ROLES.SUPERADMIN], description: 'Manage user roles and permissions' },
    { id: 'organization', label: t('organization') || 'Organization', icon: faBuilding, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Manage branches, departments, and company settings' },
    { id: 'attendance', label: t('attendanceRules') || 'Attendance Rules', icon: faClock, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure attendance policies and shift timings' },
    { id: 'analytics', label: t('analyticsConfig') || 'Analytics Config', icon: faChartLine, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure analytics dashboard settings' },
    { id: 'inventory', label: t('inventoryConfig') || 'Inventory Config', icon: faBoxes, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure inventory management settings' },
    { id: 'support', label: t('supportConfig') || 'Support Config', icon: faHeadset, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure support ticket system' },
    { id: 'notifications', label: t('notifications') || 'Notifications', icon: faBell, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure email and in-app notifications' },
    { id: 'security', label: t('security') || 'Security', icon: faShieldAlt, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Configure security policies and 2FA' },
    { id: 'data', label: t('dataManagement') || 'Data Management', icon: faDatabase, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Export, purge, and manage database records' },
    { id: 'ui', label: t('uiPreferences') || 'UI Preferences', icon: faPalette, roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SERVICE_PROVIDER], description: 'Customize theme, layout, and language' },
    { id: 'admin', label: t('adminControls') || 'Admin Controls', icon: faCrown, roles: [ROLES.SUPERADMIN], description: 'Maintenance mode, cache, system info' },
    { id: 'team', label: t('teamManagement') || 'Team Management', icon: faUsers, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'Manage team members for About Us page' },
    { id: 'audit', label: t('auditLogs') || 'Audit Logs', icon: faHistory, roles: [ROLES.SUPERADMIN, ROLES.ADMIN], description: 'View system audit logs' },
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter(
    (tab) => userRole !== null && tab.roles.includes(userRole as any)
  );

  // Set active tab from URL query or first visible tab
  useEffect(() => {
    if (!userRole || visibleTabs.length === 0) return;

    let target = activeTab;

    if (typeof tab === 'string' && visibleTabs.some(t => t.id === tab)) {
      target = tab;
    }

    if (!visibleTabs.some(t => t.id === target)) {
      target = visibleTabs[0].id;
    }

    setActiveTab(target);
  }, [userRole, tab, visibleTabs, activeTab]);

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
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <FontAwesomeIcon icon={faSlidersH} size="2x" style={{ marginBottom: '1rem' }} />
            <p>Coming soon...</p>
          </div>
        );
    }
  };

  if (userRole === null) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FontAwesomeIcon icon={faSlidersH} /> {t('settings') || 'Settings'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Manage your system preferences, user roles, and application settings.
        </p>

        {/* Tabs - Horizontal scroll on mobile */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap', 
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem',
          overflowX: 'auto',
        }}>
          {visibleTabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              style={{
                padding: '10px 20px',
                background: activeTab === tabItem.id ? '#f59e0b' : 'transparent',
                color: activeTab === tabItem.id ? '#1f2937' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeTab === tabItem.id ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              title={tabItem.description}
            >
              <FontAwesomeIcon icon={tabItem.icon} />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '1rem' }}>
          {renderTab()}
        </div>
      </div>
    </DashboardLayout>
  );
}