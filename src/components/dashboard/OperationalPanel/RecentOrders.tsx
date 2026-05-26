import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function RecentOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { setOrders(Array.isArray(data) ? data.slice(0, 5) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'delivered': return '#3b82f6';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return t('statusPending');
      case 'approved': return t('statusApproved');
      case 'delivered': return t('statusDelivered');
      case 'cancelled': return t('statusCancelled');
      default: return status || t('unknown');
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading')}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h3><FontAwesomeIcon icon={faBox} style={{ marginRight: '8px', color: '#f59e0b' }} /> {t('recentOrders')}</h3>
      {orders.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>{t('noOrdersFound')}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {orders.map(order => (
            <li key={order.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
              <Link href={`/dashboard/orders/${order.id}`} style={{ textDecoration: 'none', color: '#1f2937', display: 'block' }}>
                <strong>#{order.order_number || order.id}</strong> – {order.client_name}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: getStatusColor(order.status) }}>
                    {t('status')}: {getStatusText(order.status)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}