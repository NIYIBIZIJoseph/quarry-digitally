import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import {
  getAuthHeaders,
  getUserRoleFromToken,
  getUserBranchIdFromToken,
} from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faUser, faPhoneAlt, faTag, faFlag,
  faSave, faReply, faClock, faEnvelope, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Reply {
  id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  user_name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  category?: string;
}

export default function TicketDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/support/tickets/${id}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setTicket(data.ticket);
        setReplies(data.messages || []);
        setStatus(data.ticket.status);
        setPriority(data.ticket.priority);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const updateTicket = async () => {
    await fetch(`/api/support/tickets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, priority }),
    });
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await fetch(`/api/support/tickets/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message: newMessage }),
    });
    setNewMessage('');
    const res = await fetch(`/api/support/tickets/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    setReplies(data.messages || []);
  };

  if (loading) return <DashboardLayout>{t('loadingTicketDetails') || 'Loading ticket details...'}</DashboardLayout>;
  if (!ticket) return <DashboardLayout>{t('ticketNotFound') || 'Ticket not found'}</DashboardLayout>;

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'open': return t('statusOpen') || 'Open';
      case 'in_progress': return t('statusInProgress') || 'In Progress';
      case 'resolved': return t('statusResolved') || 'Resolved';
      case 'closed': return t('statusClosed') || 'Closed';
      default: return s;
    }
  };

  const getPriorityText = (p: string) => {
    switch (p) {
      case 'urgent': return t('priorityUrgent') || 'Urgent';
      case 'high': return t('priorityHigh') || 'High';
      case 'medium': return t('priorityMedium') || 'Medium';
      case 'low': return t('priorityLow') || 'Low';
      default: return p;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => router.push('/dashboard/support')} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('backToSupport') || 'Back to Support'}
        </button>
        <button onClick={() => window.print()} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faPrint} /> {t('print') || 'Print'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem' }}>{t('ticketHash') || 'Ticket'} #{ticket.ticket_number}</h1>
          <div>
            <span style={{ background: statusColor(ticket.status), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', marginRight: '0.5rem' }}>
              {getStatusText(ticket.status).toUpperCase()}
            </span>
            <span style={{ background: priorityColor(ticket.priority), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem' }}>
              {getPriorityText(ticket.priority).toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div><FontAwesomeIcon icon={faUser} /> <strong>{t('customer') || 'Customer'}:</strong> {ticket.user_name}</div>
          <div><FontAwesomeIcon icon={faPhoneAlt} /> <strong>{t('phone') || 'Phone'}:</strong> {ticket.phone || '-'}</div>
          <div><FontAwesomeIcon icon={faEnvelope} /> <strong>{t('email') || 'Email'}:</strong> {ticket.email || '-'}</div>
          <div><FontAwesomeIcon icon={faClock} /> <strong>{t('created') || 'Created'}:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
          <div><FontAwesomeIcon icon={faTag} /> <strong>{t('category') || 'Category'}:</strong> {ticket.category || '-'}</div>
          <div><FontAwesomeIcon icon={faFlag} /> <strong>{t('subject') || 'Subject'}:</strong> {ticket.subject}</div>
        </div>

        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <strong>{t('originalMessage') || 'Original message'}:</strong>
          <p style={{ marginTop: '4px' }}>{ticket.message}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div>
            <strong>{t('status') || 'Status'}:</strong>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="open">{t('statusOpen') || 'Open'}</option>
              <option value="in_progress">{t('statusInProgress') || 'In Progress'}</option>
              <option value="resolved">{t('statusResolved') || 'Resolved'}</option>
              <option value="closed">{t('statusClosed') || 'Closed'}</option>
            </select>
          </div>
          <div>
            <strong>{t('priority') || 'Priority'}:</strong>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="low">{t('priorityLow') || 'Low'}</option>
              <option value="medium">{t('priorityMedium') || 'Medium'}</option>
              <option value="high">{t('priorityHigh') || 'High'}</option>
              <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
            </select>
          </div>
          <button onClick={updateTicket} style={{ background: '#f59e0b', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faSave} /> {t('updateTicket') || 'Update Ticket'}
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3>{t('conversation') || 'Conversation'}</h3>
        {replies.length === 0 && <p>{t('noRepliesYet') || 'No replies yet.'}</p>}
        {replies.map(reply => (
          <div key={reply.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
            <strong>{reply.sender_name} ({reply.sender_role})</strong> <small>{new Date(reply.created_at).toLocaleString()}</small>
            <p style={{ marginTop: '4px' }}>{reply.message}</p>
          </div>
        ))}
        <form onSubmit={sendReply} style={{ marginTop: '1rem' }}>
          <textarea rows={3} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('typeYourReply') || 'Type your reply...'} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} required />
          <button type="submit" style={{ marginTop: '8px', background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faReply} /> {t('sendReply') || 'Send Reply'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}