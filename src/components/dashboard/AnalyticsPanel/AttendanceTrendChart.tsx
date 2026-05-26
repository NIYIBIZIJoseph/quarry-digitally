import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // ✅ Added Filler plugin
} from 'chart.js';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

// ✅ Register Filler plugin
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AttendanceTrendChart() {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attendance/weekly', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(weeklyData => {
        if (weeklyData.days && weeklyData.workers.length > 0) {
          const labels = weeklyData.days.map((d: any) => d.label);
          // Pre‑fill counts for each day
          const presentCounts = new Array(labels.length).fill(0);
          const lateCounts = new Array(labels.length).fill(0);
          const absentCounts = new Array(labels.length).fill(0);

          weeklyData.workers.forEach((worker: any) => {
            worker.days.forEach((day: any, idx: number) => {
              if (day.status === 'present') presentCounts[idx]++;
              else if (day.status === 'late') lateCounts[idx]++;
              else if (day.status === 'absent') absentCounts[idx]++;
            });
          });

          setChartData({
            labels,
            datasets: [
              { label: t('attendancePresent'), data: presentCounts, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
              { label: t('attendanceLate'), data: lateCounts, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4 },
              { label: t('attendanceAbsent'), data: absentCounts, borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.4 },
            ],
          });
        } else {
          // Fallback: empty chart (no data)
          setChartData({
            labels: [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')],
            datasets: [
              { label: t('attendancePresent'), data: [0,0,0,0,0,0,0], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true },
              { label: t('attendanceLate'), data: [0,0,0,0,0,0,0], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true },
              { label: t('attendanceAbsent'), data: [0,0,0,0,0,0,0], borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true },
            ],
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [t]);

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
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} ${t('employees')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('numberOfEmployees'),
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: t('dayOfWeek'),
        },
      },
    },
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        {t('loadingChart')}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
      <h4>{t('attendanceTrend')}</h4>
      <Line data={chartData} options={options} />
    </div>
  );
}