import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faSearch, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function WorkersLanding() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('workersPortal') || 'Workers Portal'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* General Lists Card */}
        <Link href="/dashboard/workers/general" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '1px solid #e5e7eb',
          }}>
            <FontAwesomeIcon icon={faList} size="3x" style={{ color: '#3b82f6', marginBottom: '1rem' }} />
            <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>{t('generalLists') || 'General Lists'}</h2>
            <p style={{ color: '#6b7280' }}>{t('generalListsDesc') || 'Simple worker list – name, department, phone. Ideal for quick reference or sharing.'}</p>
          </div>
        </Link>

        {/* Deep Seek Card */}
        <Link href="/dashboard/workers/deep" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '1px solid #e5e7eb',
          }}>
            <FontAwesomeIcon icon={faSearch} size="3x" style={{ color: '#f59e0b', marginBottom: '1rem' }} />
            <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>{t('deepSeek') || 'Deep Seek'}</h2>
            <p style={{ color: '#6b7280' }}>{t('deepSeekDesc') || 'Full worker management – salary history, documents, leave, performance reviews, attendance.'}</p>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}