// src/pages/dashboard/orders/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faPhoneAlt, faCalendarAlt, faMoneyBillWave, faTruck, faTrashAlt, faSave } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  delivery_location: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  branch_name: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrder();
      } else {
        const err = await res.json();
        alert(err.error || t('statusUpdateFailed') || 'Failed to update status');
      }
    } catch (err) {
      alert(t('networkError') || 'Network error while updating status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!confirm(t('confirmDeleteOrder') || 'Move this order to recycle bin?')) return;
    try {
      const res = await fetch(`/api/orders/${order?.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        router.push('/dashboard/orders');
      } else {
        alert(t('deleteFailed') || 'Delete failed');
      }
    } catch (err) {
      alert(t('deleteFailed') || 'Delete failed');
    }
  };

  if (loading) return <DashboardLayout>{t('loadingOrder') || 'Loading order...'}</DashboardLayout>;
  if (!order) return <DashboardLayout>{t('orderNotFound') || 'Order not found'}</DashboardLayout>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'delivered': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return t('statusApproved') || 'Approved';
      case 'delivered': return t('statusDelivered') || 'Delivered';
      case 'pending': return t('statusPending') || 'Pending';
      case 'cancelled': return t('statusCancelled') || 'Cancelled';
      default: return status || t('unknown') || 'Unknown';
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => router.back()} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('back') || 'Back'}
        </button>
        <button onClick={deleteOrder} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>{t('orderHash') || 'Order'} #{order.order_number}</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updating}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
            >
              <option value="pending">{t('statusPending') || 'Pending'}</option>
              <option value="approved">{t('statusApproved') || 'Approved'}</option>
              <option value="delivered">{t('statusDelivered') || 'Delivered'}</option>
              <option value="cancelled">{t('statusCancelled') || 'Cancelled'}</option>
            </select>
            {updating && <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('updating') || 'Updating...'}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div><FontAwesomeIcon icon={faUser} /> {order.client_name}</div>
          <div><FontAwesomeIcon icon={faPhoneAlt} /> {order.client_phone}</div>
          <div><FontAwesomeIcon icon={faCalendarAlt} /> {new Date(order.created_at).toLocaleDateString()}</div>
          <div><FontAwesomeIcon icon={faTruck} /> {order.delivery_location || '-'}</div>
          <div><FontAwesomeIcon icon={faMoneyBillWave} /> {t('total') || 'Total'}: {order.total_amount?.toLocaleString()} RWF</div>
          <div>{t('status') || 'Status'}: <span style={{ background: getStatusColor(order.status), color: 'white', padding: '2px 8px', borderRadius: '12px', marginLeft: '6px' }}>{getStatusText(order.status)}</span></div>
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>{t('items') || 'Items'}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left' }}>{t('product') || 'Product'}</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>{t('quantity') || 'Qty'}</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>{t('unitPrice') || 'Unit Price'}</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>{t('subtotal') || 'Subtotal'}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px' }}>{item.product_name}</td>
                <td style={{ padding: '8px' }}>{item.quantity}</td>
                <td style={{ padding: '8px' }}>{item.unit_price?.toLocaleString()} RWF</td>
                <td style={{ padding: '8px' }}>{item.subtotal?.toLocaleString()} RWF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}