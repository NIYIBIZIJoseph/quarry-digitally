import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler, // ✅ Added Filler plugin
} from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

// ✅ Register Filler plugin
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

export default function RevenueChart() {
  const { t } = useTranslation();
  const [data, setData] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/revenue-trend', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(trend => {
        setData({
          labels: trend.map((item: any) => new Date(item.date).toLocaleDateString()),
          values: trend.map((item: any) => item.total),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: t('revenueChartLabel') || 'Revenue (RWF)',
      data: data.values,
      backgroundColor: 'rgba(245,158,11,0.6)',
      borderColor: 'rgba(245,158,11,1)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += new Intl.NumberFormat().format(context.raw) + ' RWF';
            return label;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        {t('loadingChart') || 'Loading chart...'}
      </div>
    );
  }

  if (data.labels.length === 0) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
        {t('noDataAvailable') || 'No data available'}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
      <h4>{t('revenueTrend') || 'Revenue Trend'}</h4>
      <Bar data={chartData} options={options} />
    </div>
  );
}