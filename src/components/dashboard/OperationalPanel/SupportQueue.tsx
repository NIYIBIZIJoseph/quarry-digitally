import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faFire, faHourglassHalf, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportQueue() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/support/tickets', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const open = Array.isArray(data) ? data.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved') : [];
        setTickets(open.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return <FontAwesomeIcon icon={faFire} style={{ color: '#dc2626', marginRight: '4px' }} />;
      case 'high': return <FontAwesomeIcon icon={faFire} style={{ color: '#f59e0b', marginRight: '4px' }} />;
      case 'medium': return <FontAwesomeIcon icon={faHourglassHalf} style={{ color: '#3b82f6', marginRight: '4px' }} />;
      default: return null;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return t('priorityUrgent');
      case 'high': return t('priorityHigh');
      case 'medium': return t('priorityMedium');
      case 'low': return t('priorityLow');
      default: return priority || t('priorityNormal');
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return t('statusOpen');
      case 'in_progress': return t('statusInProgress');
      case 'pending': return t('statusPending');
      case 'closed': return t('statusClosed');
      case 'resolved': return t('statusResolved');
      default: return status || t('unknown');
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading')}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <h3>
        <FontAwesomeIcon icon={faTicketAlt} style={{ marginRight: '8px', color: '#f59e0b' }} />
        {t('supportQueue')}
      </h3>
      {tickets.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>{t('noOpenTickets')}</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tickets.map(ticket => (
            <li key={ticket.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
              <Link href={`/dashboard/support/${ticket.id}`} style={{ textDecoration: 'none', color: '#1f2937', display: 'block' }}>
                <strong>
                  <FontAwesomeIcon icon={faTicketAlt} style={{ marginRight: '6px', color: '#6b7280' }} />
                  {ticket.subject}
                </strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem' }}>
                  <span>
                    {t('priority')}: {getPriorityIcon(ticket.priority)} {getPriorityText(ticket.priority)}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {t('status')}: {getStatusText(ticket.status)}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                  {ticket.created_at && new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/dashboard/support" style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.75rem', display: 'inline-block' }}>
        {t('viewAllTickets')} →
      </Link>
    </div>
  );
}