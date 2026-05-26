import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faMoneyBillWave, faBoxes, faUsers,
  faCheckCircle, faTimesCircle, faExclamationTriangle, faUmbrellaBeach,
  faTruck, faClock, faChartSimple, faEye, faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler, // ✅ Added Filler plugin
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useTranslation } from '@/hooks/useTranslation';

// ✅ Register Filler plugin
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

export default function Analytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('operational');
  const [operational, setOperational] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [workforce, setWorkforce] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const headers = getAuthHeaders();
      try {
        const [op, fin, inv, wf] = await Promise.all([
          fetch('/api/analytics/operational', { headers }).then(res => res.json()).catch(() => ({})),
          fetch('/api/analytics/financial', { headers }).then(res => res.json()).catch(() => ({})),
          fetch('/api/analytics/inventory', { headers }).then(res => res.json()).catch(() => ({})),
          fetch('/api/analytics/workforce', { headers }).then(res => res.json()).catch(() => ({})),
        ]);
        setOperational(op);
        setFinancial(fin);
        setInventory(inv);
        setWorkforce(wf);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <DashboardLayout>{t('loadingAnalytics') || 'Loading analytics...'}</DashboardLayout>;

  const lineChartData = (labels: string[], data: number[], label: string, color = '#f59e0b') => ({
    labels,
    datasets: [{ label, data, borderColor: color, backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.3, fill: true }],
  });
  const barChartData = (labels: string[], data: number[], label: string, color = '#f59e0b') => ({
    labels,
    datasets: [{ label, data, backgroundColor: color, borderRadius: 6 }],
  });

  const renderOperational = () => {
    if (!operational || !operational.todayStats) return <p>{t('noOperationalData') || 'No operational data'}</p>;
    const { todayStats, attendanceTrend, workerRanking } = operational;
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faUsers} /> {t('totalWorkers') || 'Total Workers'}<br/><b>{todayStats.total_workers}</b>
          </div>
          <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faCheckCircle} /> {t('presentToday') || 'Present Today'}<br/><b>{todayStats.present}</b>
          </div>
          <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faTimesCircle} /> {t('absent') || 'Absent'}<br/><b>{todayStats.absent}</b>
          </div>
          <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} /> {t('late') || 'Late'}<br/><b>{todayStats.late}</b>
          </div>
          <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faUmbrellaBeach} /> {t('onLeave') || 'On Leave'}<br/><b>{todayStats.on_leave}</b>
          </div>
        </div>
        {attendanceTrend && attendanceTrend.length > 0 && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3><FontAwesomeIcon icon={faChartLine} /> {t('attendanceTrend') || 'Attendance Trend (Last 7 days)'}</h3>
            <Line data={{
              labels: attendanceTrend.map((d: any) => new Date(d.date).toLocaleDateString()),
              datasets: [
                { label: t('present') || 'Present', data: attendanceTrend.map((d: any) => d.present), borderColor: '#10b981', fill: false },
                { label: t('late') || 'Late', data: attendanceTrend.map((d: any) => d.late), borderColor: '#f59e0b', fill: false },
                { label: t('absent') || 'Absent', data: attendanceTrend.map((d: any) => d.absent), borderColor: '#ef4444', fill: false },
              ],
            }} />
          </div>
        )}
        {workerRanking && workerRanking.length > 0 && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <h3><FontAwesomeIcon icon={faUserCheck} /> {t('topReliableWorkers') || 'Top 5 Most Reliable Workers (Last 30 days)'}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>{t('worker') || 'Worker'}</th><th>{t('present') || 'Present'}</th><th>{t('late') || 'Late'}</th><th>{t('totalDays') || 'Total Days'}</th></tr>
              </thead>
              <tbody>
                {workerRanking.slice(0,5).map((w: any) => (
                  <tr key={w.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td>{w.name}</td><td style={{ padding: '8px' }}>{w.present_days}</td><td style={{ padding: '8px' }}>{w.late_days}</td><td style={{ padding: '8px' }}>{w.total_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderFinancial = () => {
    if (!financial) return <p>{t('noFinancialData') || 'No financial data'}</p>;
    const { revenueDaily, topProducts } = financial;
    const totalRevenue = revenueDaily?.reduce((sum: number, r: any) => sum + Number(r.revenue), 0) || 0;
    return (
      <div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <FontAwesomeIcon icon={faMoneyBillWave} size="2x" style={{ color: '#f59e0b' }} />
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('totalRevenueLast30') || 'Total Revenue (Last 30 days)'}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalRevenue.toLocaleString()} RWF</div>
        </div>
        {revenueDaily && revenueDaily.length > 0 && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3><FontAwesomeIcon icon={faChartLine} /> {t('revenueTrend') || 'Revenue Trend (Last 30 days)'}</h3>
            <Line data={lineChartData(revenueDaily.map((r: any) => r.date), revenueDaily.map((r: any) => r.revenue), t('revenue') || 'Revenue (RWF)')} />
          </div>
        )}
        {topProducts && topProducts.length > 0 && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <h3><FontAwesomeIcon icon={faChartSimple} /> {t('topSellingProducts') || 'Top Selling Products (by revenue)'}</h3>
            <Bar data={barChartData(topProducts.map((p: any) => p.name), topProducts.map((p: any) => p.revenue), t('revenue') || 'Revenue (RWF)')} />
          </div>
        )}
      </div>
    );
  };

  const renderInventory = () => {
    if (!inventory) return <p>{t('noInventoryData') || 'No inventory data'}</p>;
    const { fastMoving, slowMoving, deadStock, turnoverRate, productSales } = inventory;
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faTruck} /> {t('fastMoving') || 'Fast-Moving'}<br/><b>{fastMoving}</b>
          </div>
          <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faClock} /> {t('slowMoving') || 'Slow-Moving'}<br/><b>{slowMoving}</b>
          </div>
          <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faTimesCircle} /> {t('deadStock') || 'Dead Stock'}<br/><b>{deadStock}</b>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <FontAwesomeIcon icon={faChartSimple} /> {t('turnoverRate') || 'Turnover Rate'}<br/><b>{turnoverRate?.toFixed(2)}</b>
          </div>
        </div>
        {productSales && productSales.length > 0 && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <h3><FontAwesomeIcon icon={faBoxes} /> {t('productSales') || 'Product Sales (Last 30 days)'}</h3>
            <Bar data={barChartData(productSales.map((p: any) => p.name), productSales.map((p: any) => p.sold_units), t('unitsSold') || 'Units Sold', '#3b82f6')} />
          </div>
        )}
      </div>
    );
  };

  const renderWorkforce = () => {
    if (!workforce) return <p>{t('noWorkforceData') || 'No workforce data'}</p>;
    const { topReliable, mostLate, mostAbsent } = workforce;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '1rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
          <h3><FontAwesomeIcon icon={faUserCheck} /> {t('topReliableWorkers') || 'Top 5 Most Reliable'}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {topReliable?.map((w: any) => <li key={w.name} style={{ padding: '4px 0' }}>{w.name} – {w.present} {t('presentDays') || 'present days'}</li>)}
          </ul>
        </div>
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px' }}>
          <h3><FontAwesomeIcon icon={faExclamationTriangle} /> {t('mostLateArrivals') || 'Most Late Arrivals'}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mostLate?.map((w: any) => <li key={w.name} style={{ padding: '4px 0' }}>{w.name} – {w.late_count} {t('lateDays') || 'late days'}</li>)}
          </ul>
        </div>
        <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '12px' }}>
          <h3><FontAwesomeIcon icon={faTimesCircle} /> {t('mostAbsentWorkers') || 'Most Absent Workers'}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mostAbsent?.map((w: any) => <li key={w.name} style={{ padding: '4px 0' }}>{w.name} – {w.absent_count} {t('absentDays') || 'absent days'}</li>)}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('analyticsDashboard') || 'Analytics Dashboard'}</h1>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'operational', label: t('operational') || 'Operational', icon: faChartLine },
          { id: 'financial', label: t('financial') || 'Financial', icon: faMoneyBillWave },
          { id: 'inventory', label: t('inventory') || 'Inventory', icon: faBoxes },
          { id: 'workforce', label: t('workforce') || 'Workforce', icon: faUsers },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : 'none',
              color: activeTab === tab.id ? '#f59e0b' : '#4b5563',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'operational' && renderOperational()}
      {activeTab === 'financial' && renderFinancial()}
      {activeTab === 'inventory' && renderInventory()}
      {activeTab === 'workforce' && renderWorkforce()}
    </DashboardLayout>
  );
}