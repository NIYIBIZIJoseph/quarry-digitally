import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function InventoryHealthChart() {
  const { t } = useTranslation();
  const [data, setData] = useState({ healthy: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(products => {
        const healthy = products.filter((p: any) => p.stock_quantity > (p.reorder_level || 5)).length;
        const lowStock = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
        const outOfStock = products.filter((p: any) => p.stock_quantity === 0).length;
        setData({ healthy, lowStock, outOfStock });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getLabelTranslation = (label: string) => {
    switch (label) {
      case 'healthy': return t('inventoryHealthy');
      case 'lowStock': return t('inventoryLowStock');
      case 'outOfStock': return t('inventoryOutOfStock');
      default: return label;
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        {t('loadingChart')}
      </div>
    );
  }

  const hasData = data.healthy > 0 || data.lowStock > 0 || data.outOfStock > 0;

  if (!hasData) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
        {t('noInventoryData')}
      </div>
    );
  }

  const chartData = {
    labels: [t('inventoryHealthy'), t('inventoryLowStock'), t('inventoryOutOfStock')],
    datasets: [{
      data: [data.healthy, data.lowStock, data.outOfStock],
      backgroundColor: ['#10b981', '#f59e0b', '#dc2626'],
      borderWidth: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
      <h4>{t('inventoryHealth')}</h4>
      <Pie data={chartData} options={options} />
    </div>
  );
}