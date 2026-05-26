import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEye, faTicketAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function IncomingMessages() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/contact-messages', { headers: getAuthHeaders() });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: number) => {
    await fetch('/api/contact-messages', { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ id }) });
    fetchMessages();
  };

  const convertToTicket = async (msg: any) => {
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_name: msg.name,
          phone: msg.phone,
          subject: msg.subject || t('contactFormMessage') || 'Contact form message',
          message: msg.message,
          priority: 'medium',
        }),
      });
      if (res.ok) {
        await markAsRead(msg.id);
        alert(t('ticketCreatedFromMessage') || 'Ticket created from message');
      } else alert(t('failedToCreateTicket') || 'Failed to create ticket');
    } catch (err) {
      alert(t('errorCreatingTicket') || 'Error creating ticket');
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm(t('confirmDeleteMessage') || 'Delete this message?')) return;
    await fetch(`/api/contact-messages?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchMessages();
  };

  if (loading) return <div>{t('loadingMessages') || 'Loading messages...'}</div>;

  return (
    <div>
      {messages.length === 0 && <p>{t('noIncomingMessages') || 'No incoming messages.'}</p>}
      {messages.map(msg => (
        <div key={msg.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <strong>{msg.name}</strong> ({msg.email || msg.phone})<br />
              <small>{new Date(msg.created_at).toLocaleString()}</small>
              {msg.subject && <div><strong>{t('subject')}:</strong> {msg.subject}</div>}
            </div>
            <div>
              {!msg.is_read && <span style={{ background: '#f59e0b', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', marginRight: '8px' }}>{t('new') || 'New'}</span>}
              <button onClick={() => markAsRead(msg.id)} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faEye} /> {t('markRead') || 'Mark Read'}
              </button>
              <button onClick={() => convertToTicket(msg)} style={{ marginRight: '8px', background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faTicketAlt} /> {t('convertToTicket') || 'Convert to Ticket'}
              </button>
              <button onClick={() => deleteMessage(msg.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faTrashAlt} /> {t('delete') || 'Delete'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: '8px', background: '#f9fafb', padding: '8px', borderRadius: '4px' }}>{msg.message}</div>
        </div>
      ))}
    </div>
  );
}