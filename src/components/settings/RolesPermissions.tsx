import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSave } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Role {
  id: number;
  name: string;
  permissions: number[];
}

interface Permission {
  id: number;
  name: string;
  description: string;
}

export default function RolesPermissions() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // Get user role from localStorage
  let userRole = '';
  if (typeof window !== 'undefined') {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userRole = user.role || '';
    } catch (e) {}
  }
  const canEdit = userRole === 'superadmin';

  // Map module names to translations
  const getTranslatedModule = (module: string): string => {
    const moduleMap: Record<string, string> = {
      'admin': t('module_admin'),
      'analytics': t('module_analytics'),
      'attendance': t('module_attendance'),
      'audit': t('module_audit'),
      'branch': t('module_branch'),
      'dashboard': t('module_dashboard'),
      'department': t('module_department'),
      'faq': t('module_faq'),
      'finance': t('module_finance'),
      'inventory': t('module_inventory'),
      'order': t('module_order'),
      'product': t('module_product'),
      'recycle': t('module_recycle'),
      'roles': t('module_roles'),
      'security': t('module_security'),
      'settings': t('module_settings'),
      'support': t('module_support'),
      'user': t('module_user'),
      'worker': t('module_worker'),
    };
    return moduleMap[module] || module;
  };

  // Map permission names to translations
  const getTranslatedPermission = (permName: string): string => {
    const permMap: Record<string, string> = {
      // Admin
      'admin:controls': t('perm_admin_controls'),
      // Analytics
      'analytics:view': t('perm_analytics_view'),
      // Attendance
      'attendance:mark': t('perm_attendance_mark'),
      'attendance:override': t('perm_attendance_override'),
      'attendance:view': t('perm_attendance_view'),
      // Audit
      'audit:view': t('perm_audit_view'),
      // Branch
      'branch:create': t('perm_branch_create'),
      'branch:delete': t('perm_branch_delete'),
      'branch:edit': t('perm_branch_edit'),
      'branch:switch': t('perm_branch_switch'),
      'branch:view': t('perm_branch_view'),
      // Dashboard
      'dashboard:view': t('perm_dashboard_view'),
      // Department
      'department:create': t('perm_department_create'),
      'department:delete': t('perm_department_delete'),
      'department:edit': t('perm_department_edit'),
      'department:view': t('perm_department_view'),
      // FAQ
      'faq:manage': t('perm_faq_manage'),
      // Finance
      'finance:view': t('perm_finance_view'),
      // Inventory
      'inventory:adjust': t('perm_inventory_adjust'),
      'inventory:transfer': t('perm_inventory_transfer'),
      'inventory:view': t('perm_inventory_view'),
      // Order
      'order:create': t('perm_order_create'),
      'order:delete': t('perm_order_delete'),
      'order:edit': t('perm_order_edit'),
      'order:view': t('perm_order_view'),
      // Product
      'product:create': t('perm_product_create'),
      'product:delete': t('perm_product_delete'),
      'product:edit': t('perm_product_edit'),
      'product:view': t('perm_product_view'),
      // Recycle
      'recycle:view': t('perm_recycle_view'),
      // Roles
      'roles:create': t('perm_roles_create'),
      'roles:delete': t('perm_roles_delete'),
      'roles:edit': t('perm_roles_edit'),
      'roles:view': t('perm_roles_view'),
      // Security
      'security:view': t('perm_security_view'),
      // Settings
      'settings:edit': t('perm_settings_edit'),
      'settings:view': t('perm_settings_view'),
      // Support
      'support:create': t('perm_support_create'),
      'support:manage': t('perm_support_manage'),
      'support:reply': t('perm_support_reply'),
      'support:view': t('perm_support_view'),
      // User
      'user:create': t('perm_user_create'),
      'user:delete': t('perm_user_delete'),
      'user:edit': t('perm_user_edit'),
      'user:suspend': t('perm_user_suspend'),
      'user:view': t('perm_user_view'),
      // Worker
      'worker:create': t('perm_worker_create'),
      'worker:delete': t('perm_worker_delete'),
      'worker:documents': t('perm_worker_documents'),
      'worker:edit': t('perm_worker_edit'),
      'worker:leave': t('perm_worker_leave'),
      'worker:view': t('perm_worker_view'),
    };
    return permMap[permName] || permName;
  };

  // Map permission descriptions to translations
  const getTranslatedDescription = (description: string): string => {
    const descMap: Record<string, string> = {
      'Access admin controls (maintenance, cache, system info)': t('perm_admin_controls_desc'),
      'Override attendance': t('perm_attendance_override_desc'),
      'View attendance': t('perm_attendance_view_desc'),
      'Create new branches': t('perm_branch_create_desc'),
      'Delete branches': t('perm_branch_delete_desc'),
      'Edit branches': t('perm_branch_edit_desc'),
      'View branches': t('perm_branch_view_desc'),
      'Create departments': t('perm_department_create_desc'),
      'Delete departments': t('perm_department_delete_desc'),
      'Edit departments': t('perm_department_edit_desc'),
      'View departments': t('perm_department_view_desc'),
      'Create new roles': t('perm_roles_create_desc'),
      'Delete roles': t('perm_roles_delete_desc'),
      'Create workers': t('perm_worker_create_desc'),
      'Delete workers': t('perm_worker_delete_desc'),
      'Manage worker documents': t('perm_worker_documents_desc'),
      'Edit workers': t('perm_worker_edit_desc'),
      'Manage worker leave requests': t('perm_worker_leave_desc'),
      'View workers': t('perm_worker_view_desc'),
    };
    return descMap[description] || description;
  };

  // Map role names to translations
  const getTranslatedRole = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      'superadmin': t('role_superadmin'),
      'admin': t('role_admin'),
      'service_provider': t('role_service_provider'),
      'supervisor': t('role_supervisor'),
      'maintenance': t('role_maintenance'),
      'crusherman': t('role_crusherman'),
      'operator': t('role_operator'),
      'cardriver': t('role_cardriver'),
      'day_worker': t('role_day_worker'),
    };
    return roleMap[roleName] || roleName;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers: getAuthHeaders() }),
        fetch('/api/permissions', { headers: getAuthHeaders() }),
      ]);
      if (!rolesRes.ok) throw new Error(`Roles API error: ${rolesRes.status}`);
      if (!permsRes.ok) throw new Error(`Permissions API error: ${permsRes.status}`);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      const rolesList = rolesData.roles || (Array.isArray(rolesData) ? rolesData : []);
      const permsList = Array.isArray(permsData) ? permsData : (permsData.data || []);
      setRoles(rolesList);
      setAllPermissions(permsList);
      if (rolesList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesList[0].id);
        setSelectedPerms(rolesList[0].permissions || []);
      }
    } catch (err) {
      console.error(err);
      setError(t('failedToLoadRoles') || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const role = roles.find(r => r.id === selectedRoleId);
    if (role) setSelectedPerms(role.permissions || []);
  }, [selectedRoleId, roles]);

  const handlePermissionToggle = (permId: number) => {
    if (!canEdit) return;
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const savePermissions = async () => {
    if (!selectedRoleId || !canEdit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissionIds: selectedPerms }),
      });
      if (res.ok) {
        alert(t('permissionsUpdated') || 'Permissions updated');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || t('updateFailed') || 'Update failed');
      }
    } catch (err) {
      alert(t('errorUpdatingPermissions') || 'Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      if (res.ok) {
        setShowAddRole(false);
        setNewRoleName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || t('failedToCreateRole') || 'Failed to create role');
      }
    } catch (err) {
      alert(t('errorCreatingRole') || 'Error creating role');
    }
  };

  const deleteRole = async (roleId: number) => {
    if (!confirm(t('confirmDeleteRole') || 'Delete this role? It cannot be restored.')) return;
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        if (selectedRoleId === roleId) setSelectedRoleId(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      alert(t('errorDeletingRole') || 'Error deleting role');
    }
  };

  if (loading) return <div>{t('loadingRoles') || 'Loading roles...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  // Group permissions by module (prefix before colon)
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const module = perm.name.split(':')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
      {/* Left: Roles list */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', height: 'fit-content' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>{t('roles') || 'Roles'}</h3>
          {canEdit && (
            <button onClick={() => setShowAddRole(true)} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faPlus} /> {t('add') || 'Add'}
            </button>
          )}
        </div>
        {showAddRole && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '4px' }}>
            <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder={t('roleName') || 'Role name'} style={{ flex: 1, padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button onClick={addRole} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('save') || 'Save'}</button>
            <button onClick={() => setShowAddRole(false)} style={{ background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('cancel') || 'Cancel'}</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {roles.map(role => (
            <div key={role.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selectedRoleId === role.id ? '#fef3c7' : 'transparent', borderRadius: '8px', padding: '4px 8px' }}>
              <button onClick={() => setSelectedRoleId(role.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', flex: 1, fontWeight: selectedRoleId === role.id ? 'bold' : 'normal' }}>
                {getTranslatedRole(role.name)}
              </button>
              {canEdit && role.name !== 'superadmin' && (
                <button onClick={() => deleteRole(role.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Permissions matrix */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
        {selectedRoleId ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>{t('permissionsFor') || 'Permissions for'} {getTranslatedRole(roles.find(r => r.id === selectedRoleId)?.name || '')}</h3>
              {canEdit && (
                <button onClick={savePermissions} disabled={saving} style={{ background: '#f59e0b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faSave} /> {saving ? (t('saving') || 'Saving...') : (t('savePermissions') || 'Save Permissions')}
                </button>
              )}
            </div>
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ textTransform: 'capitalize', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  {getTranslatedModule(module)}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem', marginTop: '8px' }}>
                  {perms.map(perm => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.7 }}>
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        disabled={!canEdit}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{getTranslatedPermission(perm.name)}</span>
                      {perm.description && (
                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                          ({getTranslatedDescription(perm.description)})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p>{t('selectRoleToViewPermissions') || 'Select a role to view permissions.'}</p>
        )}
      </div>
    </div>
  );
}