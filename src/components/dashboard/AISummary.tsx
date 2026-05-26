import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChartLine, faExclamationTriangle, faTicketAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function AISummary() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(t('loadingInsights') || 'Loading insights...');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const headers = getAuthHeaders();
        const [revenueRes, ticketsRes, productsRes, attendanceRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers }),
          fetch('/api/support/tickets', { headers }),
          fetch('/api/products', { headers }),
          fetch('/api/attendance/weekly', { headers }),
        ]);

        const revenueData = await revenueRes.json();
        const tickets = await ticketsRes.json();
        const products = await productsRes.json();
        const attendanceData = await attendanceRes.json();

        const lowStockCount = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5)).length;
        const openTickets = tickets.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length;
        const absentToday = attendanceData.summary?.absentToday || 0;
        const revenue = revenueData.revenue || 0;

        setSummary(`${t('revenue') || 'Revenue'}: ${revenue.toLocaleString()} RWF. ${t('lowStockAlert') || 'Low stock'}: ${lowStockCount}. ${t('openTicketsAlert') || 'Open tickets'}: ${openTickets}. ${t('absentTodayAlert') || 'Absent today'}: ${absentToday}.`);
      } catch (err) {
        console.error(err);
        setSummary(t('unableToLoadInsights') || 'Unable to load insights. Please refresh.');
      }
    };
    fetchSummary();
  }, [t]);

  return (
    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
      <FontAwesomeIcon icon={faRobot} /> {summary}
    </div>
  );
}