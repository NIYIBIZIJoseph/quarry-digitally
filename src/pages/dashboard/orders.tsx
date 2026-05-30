import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders, getUserRoleFromToken } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faEye,
  faFileExport,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faCheckCircle,
  faTimesCircle,
  faTruck,
  faClock,
  faEdit,
  faTrashAlt,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/lib/roles';

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

  const [branches, setBranches] = useState<
    { id: number; name: string }[]
  >([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

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
      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

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
      const res = await fetch('/api/branches', {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      setBranches(Array.isArray(data) ? data : []);
    } catch {
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

  const isSuperAdmin = userRole === ROLES.SUPERADMIN;
  const isAdmin = userRole === ROLES.ADMIN || isSuperAdmin;

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
    const lastDay = new Date(newYear, newMonth, 0)
      .toISOString()
      .slice(0, 10);

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
      t('date') || 'Date',
    ];

    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.client_name,
      o.client_phone,
      o.product_names || '-',
      o.total_amount?.toLocaleString() || '0',
      o.status,
      o.payment_status,
      new Date(o.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; color: string; icon: any; label: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: faClock, label: t('statusPending') || 'Pending' },
      approved: { bg: '#d1fae5', color: '#065f46', icon: faCheckCircle, label: t('statusApproved') || 'Approved' },
      delivered: { bg: '#dbeafe', color: '#1e40af', icon: faTruck, label: t('statusDelivered') || 'Delivered' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', icon: faTimesCircle, label: t('statusCancelled') || 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{ background: config.bg, color: config.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FontAwesomeIcon icon={config.icon} size="xs" />
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') {
      return <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>{t('paid') || 'Paid'}</span>;
    }
    return <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>{t('unpaid') || 'Unpaid'}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingOrders') || 'Loading orders...'}</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t('marketOrders') || 'Market Orders'}</h1>
          <button onClick={exportToCSV} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV') || 'Export CSV'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
              <FontAwesomeIcon icon={faSearch} style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder={t('searchOrders') || 'Search by order #, customer name, phone...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="all">{t('allStatus') || 'All Status'}</option>
              <option value="pending">{t('statusPending') || 'Pending'}</option>
              <option value="approved">{t('statusApproved') || 'Approved'}</option>
              <option value="delivered">{t('statusDelivered') || 'Delivered'}</option>
              <option value="cancelled">{t('statusCancelled') || 'Cancelled'}</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="all">{t('allPayment') || 'All Payment'}</option>
              <option value="paid">{t('paid') || 'Paid'}</option>
              <option value="unpaid">{t('unpaid') || 'Unpaid'}</option>
            </select>
            {isSuperAdmin && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
              >
                <option value="all">{t('allBranches') || 'All Branches'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => handleMonthChange(-1)} style={{ background: '#e5e7eb', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <span style={{ minWidth: '100px', textAlign: 'center' }}>{currentMonth}</span>
              <button onClick={() => handleMonthChange(1)} style={{ background: '#e5e7eb', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
            {(startDate || endDate || search || statusFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setBranchFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setCurrentMonth(new Date().toISOString().slice(0, 7));
                }}
                style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                {t('clearDates') || 'Clear Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('orderNumber') || 'Order #'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('customer') || 'Customer'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('phone') || 'Phone'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('products') || 'Products'}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{t('total') || 'Total'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t('status') || 'Status'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t('paymentStatus') || 'Payment'}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('date') || 'Date'}</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                 <td style={{ padding: '12px', fontWeight: '500' }}>{order.order_number}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{order.client_name}</strong>
                    {order.branch_name && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{order.branch_name}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>{order.client_phone}</td>
                  <td style={{ padding: '12px' }}>
                    {order.product_names ? (
                      <span title={order.product_names}>
                        {order.product_names.length > 50 ? order.product_names.substring(0, 50) + '...' : order.product_names}
                      </span>
                    ) : (
                      `${order.product_count || 0} items`
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                    {order.total_amount?.toLocaleString()} RWF
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getPaymentBadge(order.payment_status)}</td>
                  <td style={{ padding: '12px' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <button style={{ background: '#e5e7eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FontAwesomeIcon icon={faEye} /> {t('view') || 'View'}
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    {t('noOrdersFound') || 'No orders found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}