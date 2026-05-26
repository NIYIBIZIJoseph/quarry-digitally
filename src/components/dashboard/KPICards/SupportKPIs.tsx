import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faFire, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ openTickets: 0, urgentTickets: 0, avgResponseTime: '2.4h' });

  useEffect(() => {
    fetch('/api/support/tickets', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(tickets => {
        const open = tickets.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length;
        const urgent = tickets.filter((t: any) => t.priority === 'urgent' && t.status !== 'closed').length;
        setStats({ openTickets: open, urgentTickets: urgent, avgResponseTime: '2.4h' });
      })
      .catch(console.error);
  }, []);

  const cards = [
    { label: t('openTickets'), value: stats.openTickets, sub: t('needsReply'), icon: faTicketAlt, color: '#fef3c7' },
    { label: t('urgent'), value: stats.urgentTickets, sub: t('highPriority'), icon: faFire, color: '#fee2e2' },
    { label: t('avgResponse'), value: stats.avgResponseTime, sub: t('firstReply'), icon: faClock, color: '#fff' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{ background: card.color, padding: '0.75rem', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
            <FontAwesomeIcon icon={card.icon} fixedWidth /> {card.label}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{card.value}</div>
          {card.sub && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}