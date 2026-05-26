import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTicketAlt, faEnvelope, faUsers, faChartLine, faClock, 
  faCheckCircle, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    urgentIssues: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const headers = getAuthHeaders();
      const ticketsRes = await fetch('/api/support/tickets', { headers });
      const tickets = await ticketsRes.json();
      const open = tickets.filter((t: any) => t.status === 'open').length;
      const pending = tickets.filter((t: any) => t.status === 'in_progress').length;
      const resolved = tickets.filter((t: any) => t.status === 'resolved').length;
      const urgent = tickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'closed').length;
      const messagesRes = await fetch('/api/contact-messages', { headers });
      const messages = await messagesRes.json();
      const unread = messages.filter((m: any) => !m.is_read).length;
      setStats({ totalTickets: tickets.length, openTickets: open, pendingTickets: pending, resolvedTickets: resolved, urgentIssues: urgent, unreadMessages: unread });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: t('totalTickets'), value: stats.totalTickets, icon: faTicketAlt, color: '#fff' },
    { label: t('open'), value: stats.openTickets, icon: faTicketAlt, color: '#fef3c7' },
    { label: t('inProgress'), value: stats.pendingTickets, icon: faClock, color: '#dbeafe' },
    { label: t('resolved'), value: stats.resolvedTickets, icon: faCheckCircle, color: '#d1fae5' },
    { label: t('urgent'), value: stats.urgentIssues, icon: faExclamationTriangle, color: '#fee2e2' },
    { label: t('unreadMessages'), value: stats.unreadMessages, icon: faEnvelope, color: '#e0e7ff' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem' }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{ background: card.color, padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}><FontAwesomeIcon icon={card.icon} fixedWidth /> {card.label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}