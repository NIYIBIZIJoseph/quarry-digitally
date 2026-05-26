import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SupportOverview from '@/components/support/SupportOverview';
import IncomingMessages from '@/components/support/IncomingMessages';
import TicketList from '@/components/support/TicketList';
import FAQManager from '@/components/support/FAQManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faEnvelope, faTicketAlt, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: t('overview') || 'Overview', icon: faChartLine },
    { id: 'incoming', label: t('incomingMessages') || 'Incoming Messages', icon: faEnvelope },
    { id: 'tickets', label: t('tickets') || 'Tickets', icon: faTicketAlt },
    { id: 'faq', label: t('faq') || 'FAQ', icon: faQuestionCircle },
  ];

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('supportCenter') || 'Support Center'}</h1>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
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
            <FontAwesomeIcon icon={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && <SupportOverview />}
      {activeTab === 'incoming' && <IncomingMessages />}
      {activeTab === 'tickets' && <TicketList />}
      {activeTab === 'faq' && <FAQManager />}
    </DashboardLayout>
  );
}