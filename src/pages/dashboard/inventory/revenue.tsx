import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faArrowLeft, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductRevenue {
  id: number;
  name: string;
  category_name: string;
  revenue: number;
}

export default function RevenueOverview() {
  const { t } = useTranslation();
  const [revenues, setRevenues] = useState<ProductRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch('/api/inventory/revenue-stats', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch revenue');
        const data = await res.json();
        setTotalRevenue(data.totalRevenue);
        setRevenues(data.perProductRevenue || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (loading) return <DashboardLayout>{t('loadingRevenue') || 'Loading revenue overview...'}</DashboardLayout>;
  if (error) return <DashboardLayout>{t('error') || 'Error'}: {error}</DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('revenueOverview') || 'Revenue Overview'}</h1>
        <button onClick={() => window.history.back()} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('back') || 'Back'}
        </button>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
        <FontAwesomeIcon icon={faMoneyBillWave} size="2x" style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('totalRevenueDesc') || 'Total Revenue (All delivered orders)'}</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{totalRevenue.toLocaleString()} RWF</div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
        <FontAwesomeIcon icon={faChartLine} /> {t('revenueByProduct') || 'Revenue by Product'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {revenues.length === 0 ? (
          <p>{t('noRevenueData') || 'No revenue data yet. Complete orders to see revenue.'}</p>
        ) : (
          revenues.map(product => (
            <div key={product.id} style={{ background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{product.name}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{product.category_name}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {product.revenue.toLocaleString()} RWF
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}