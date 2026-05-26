import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShoppingCart, faUserPlus, faCalendarCheck, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { getUserRoleFromToken } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

export default function QuickActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
  }, []);

  const actions = [
    { label: t('addProduct'), icon: faPlus, path: '/dashboard/products/new', roles: ['superadmin', 'admin', 'service_provider'] },
    { label: t('createOrder'), icon: faShoppingCart, path: '/dashboard/orders/new', roles: ['superadmin', 'admin', 'service_provider'] },
    { label: t('addWorker'), icon: faUserPlus, path: '/dashboard/workers/new', roles: ['superadmin', 'admin', 'supervisor'] },
    { label: t('markAttendance'), icon: faCalendarCheck, path: '/dashboard/attendance/mark', roles: ['superadmin', 'admin', 'supervisor'] },
    { label: t('openTicket'), icon: faTicketAlt, path: '/dashboard/support/new', roles: ['superadmin', 'admin', 'service_provider', 'supervisor'] },
  ];

  const visibleActions = actions.filter(action => userRole && action.roles.includes(userRole));

  if (visibleActions.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>{t('quickActions')}</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {visibleActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => router.push(action.path)}
            style={{
              background: '#f59e0b',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              color: '#1f2937',
            }}
          >
            <FontAwesomeIcon icon={action.icon} /> {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}