import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faEye, faTrashAlt, faSearch, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function TicketList() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    fetch(`/api/support/tickets?${params.toString()}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => { setTickets(data); setLoading(false); })
      .catch(err => console.error(err));
  }, [filters]);

  if (loading) return <div>{t('loadingTickets') || 'Loading tickets...'}</div>;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('priorityUrgent') || 'Urgent';
      case 'high': return t('priorityHigh') || 'High';
      case 'medium': return t('priorityMedium') || 'Medium';
      case 'low': return t('priorityLow') || 'Low';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return t('statusOpen') || 'Open';
      case 'in_progress': return t('statusInProgress') || 'In Progress';
      case 'resolved': return t('statusResolved') || 'Resolved';
      case 'closed': return t('statusClosed') || 'Closed';
      default: return status;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder={t('searchTicketsPlaceholder') || 'Search by name, email, phone...'} value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={{ padding: '8px 8px 8px 32px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }} />
        </div>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="">{t('allStatus') || 'All Status'}</option>
          <option value="open">{t('statusOpen') || 'Open'}</option>
          <option value="in_progress">{t('statusInProgress') || 'In Progress'}</option>
          <option value="resolved">{t('statusResolved') || 'Resolved'}</option>
          <option value="closed">{t('statusClosed') || 'Closed'}</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="">{t('allPriorities') || 'All Priorities'}</option>
          <option value="low">{t('priorityLow') || 'Low'}</option>
          <option value="medium">{t('priorityMedium') || 'Medium'}</option>
          <option value="high">{t('priorityHigh') || 'High'}</option>
          <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
        </select>
        <button onClick={() => setFilters({ status: '', priority: '', search: '' })} style={{ padding: '8px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {t('reset') || 'Reset'}
        </button>
        <Link href="/dashboard/support/new">
          <button style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPlus} /> {t('newTicket') || 'New Ticket'}
          </button>
        </Link>
      </div>
      {tickets.length === 0 ? (
        <p>{t('noTicketsFound') || 'No tickets found.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th>{t('id') || 'ID'}</th>
                <th>{t('customer') || 'Customer'}</th>
                <th>{t('subject') || 'Subject'}</th>
                <th>{t('priority') || 'Priority'}</th>
                <th>{t('status') || 'Status'}</th>
                <th>{t('created') || 'Created'}</th>
                <th>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticketItem) => (
                <tr key={ticketItem.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{ticketItem.ticket_number}</td>
                  <td style={{ padding: '12px' }}>{ticketItem.user_name}<br/><small>{ticketItem.phone}</small></td>
                  <td style={{ padding: '12px' }}>{ticketItem.subject}</td>
                  <td style={{ padding: '12px', color: getPriorityColor(ticketItem.priority) }}><strong>{getPriorityText(ticketItem.priority)}</strong></td>
                  <td style={{ padding: '12px' }}>{getStatusText(ticketItem.status)}</td>
                  <td style={{ padding: '12px' }}>{new Date(ticketItem.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <Link href={`/dashboard/support/${ticketItem.id}`} style={{ marginRight: '8px', color: '#3b82f6' }}>
                      <FontAwesomeIcon icon={faEye} /> {t('view') || 'View'}
                    </Link>
                    <button 
                      onClick={() => { 
                        if (confirm(t('confirmDeleteTicket') || 'Delete this ticket?')) 
                          fetch(`/api/support/tickets?id=${ticketItem.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                            .then(() => setFilters({ ...filters })); 
                      }} 
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}