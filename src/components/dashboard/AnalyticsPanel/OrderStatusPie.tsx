import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusData {
  status: string;
  count: number;
}

export default function OrderStatusPie() {
  const { t } = useTranslation();
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/order-status', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        console.log('Order status data:', result);
        setData(Array.isArray(result) ? result : []);
      } catch (err: unknown) {
        console.error('Error fetching order status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusTranslation = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return t('statusPending') || 'Pending';
      case 'approved': return t('statusApproved') || 'Approved';
      case 'delivered': return t('statusDelivered') || 'Delivered';
      case 'cancelled': return t('statusCancelled') || 'Cancelled';
      default: return status || t('unknown') || 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'delivered': return '#3b82f6';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loadingChart') || 'Loading chart...'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#dc2626', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Error: {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('noOrderData') || 'No order data available'}
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: data.map(item => getStatusTranslation(item.status)),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getStatusColor(item.status)),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12 },
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
        {t('orderStatusDistribution') || 'Order Status Distribution'}
      </h4>
      <div style={{ maxWidth: '300px', margin: '0 auto' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}