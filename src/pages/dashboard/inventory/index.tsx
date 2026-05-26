import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faMoneyBillWave, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function InventoryLanding() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('inventoryPortal') || 'Inventory Portal'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <Link href="/dashboard/inventory/stock" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s',
          }}>
            <FontAwesomeIcon icon={faBox} size="3x" style={{ color: '#f59e0b', marginBottom: '1rem' }} />
            <h2 style={{ color: '#1f2937' }}>{t('stockOverview') || 'Stock Overview'}</h2>
            <p style={{ color: '#6b7280' }}>{t('stockOverviewDesc') || 'View product stock levels, low stock alerts, and fast‑moving items.'}</p>
          </div>
        </Link>
        <Link href="/dashboard/inventory/revenue" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s',
          }}>
            <FontAwesomeIcon icon={faMoneyBillWave} size="3x" style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h2 style={{ color: '#1f2937' }}>{t('revenueOverview') || 'Revenue Overview'}</h2>
            <p style={{ color: '#6b7280' }}>{t('revenueOverviewDesc') || 'See revenue per product and total earnings from delivered orders.'}</p>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}