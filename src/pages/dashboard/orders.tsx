import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faTrashAlt, faFileExport, faSearch, faCalendarAlt,
  faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  branch_name: string;
  product_names: string | null;
  product_count: number;
}

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const userRole = getUserRoleFromToken();

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (paymentFilter !== 'all') params.append('payment', paymentFilter);
    if (branchFilter !== 'all') params.append('branch', branchFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    try {
      const res = await fetch(`/api/orders?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', { headers: getAuthHeaders() });
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter, branchFilter, startDate, endDate]);

  const handleMonthChange = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonth(newMonthStr);
    const firstDay = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(newYear, newMonth, 0).toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const exportToCSV = () => {
    const headers = [
      t('orderNumber') || 'Order #',
      t('customer') || 'Customer',
      t('phone') || 'Phone',
      t('products') || 'Products',
      t('total') || 'Total (RWF)',
      t('status') || 'Status',
      t('paymentStatus') || 'Payment',
      t('date') || 'Date'
    ];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.client_name,
      o.client_phone,
      o.product_names || '-',
      o.total_amount?.toLocaleString() || '0',
      getStatusText(o.status),
      getPaymentText(o.payment_status),
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'delivered': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPaymentText = (payment: string) => {
    switch (payment) {
      case 'paid': return t('paid') || 'Paid';
      case 'unpaid': return t('unpaid') || 'Unpaid';
      default: return payment || t('unknown') || 'Unknown';
    }
  };

  if (loading) return <DashboardLayout>{t('loadingOrders') || 'Loading orders...'}</DashboardLayout>;
  if (error) return <DashboardLayout>{t('error') || 'Error'}: {error}</DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('marketOrders') || 'Market Orders'}</h1>
        <button onClick={exportToCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder={t('searchOrders') || 'Search by order #, client name, phone...'} value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 8px 8px 32px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="all">{t('allStatus') || 'All Status'}</option>
          <option value="pending">{t('statusPending') || 'Pending'}</option>
          <option value="approved">{t('statusApproved') || 'Approved'}</option>
          <option value="delivered">{t('statusDelivered') || 'Delivered'}</option>
          <option value="cancelled">{t('statusCancelled') || 'Cancelled'}</option>
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="all">{t('allPayment') || 'All Payment'}</option>
          <option value="paid">{t('paid') || 'Paid'}</option>
          <option value="unpaid">{t('unpaid') || 'Unpaid'}</option>
        </select>
        {userRole === 'superadmin' && branches.length > 0 && (
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="all">{t('allBranches') || 'All Branches'}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Date / Month filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => handleMonthChange(-1)} style={{ background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span style={{ fontWeight: 'bold' }}>{currentMonth}</span>
          <button onClick={() => handleMonthChange(1)} style={{ background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <div>
          <label>{t('from') || 'From'}: </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label>{t('to') || 'To'}: </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <button onClick={() => { setStartDate(''); setEndDate(''); setCurrentMonth(''); }} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          {t('clearDates') || 'Clear Dates'}
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <p>{t('noOrdersFound') || 'No orders found.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th>{t('orderNumber') || 'Order #'}</th>
                <th>{t('customer') || 'Customer'}</th>
                <th>{t('phone') || 'Phone'}</th>
                <th>{t('products') || 'Products'}</th>
                <th>{t('total') || 'Total (RWF)'}</th>
                <th>{t('paymentStatus') || 'Payment'}</th>
                <th>{t('status') || 'Status'}</th>
                <th>{t('date') || 'Date'}</th>
                <th>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>#{order.order_number}</td>
                  <td style={{ padding: '12px' }}>{order.client_name}</td>
                  <td style={{ padding: '12px' }}>{order.client_phone}</td>
                  <td style={{ padding: '12px' }}>{order.product_names || '-'}</td>
                  <td style={{ padding: '12px' }}>{order.total_amount?.toLocaleString() || '0'}</td>
                  <td style={{ padding: '12px' }}>
                    {order.payment_status === 'paid' ? '✅ ' + (t('paid') || 'Paid') : '❌ ' + (t('unpaid') || 'Unpaid')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: getStatusColor(order.status),
                      color: 'white', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem'
                    }}>{getStatusText(order.status)}</span>
                  </td>
                  <td style={{ padding: '12px' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', marginRight: '8px', cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faEye} /> {t('view') || 'View'}
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}