import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

export default function SupportConfig() {
  return (
    <div>
      <h2><FontAwesomeIcon icon={faHeadset} /> Support System Settings</h2>
      <p>Auto‑create tickets, default priority, assignment rules, SLA.</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <p><FontAwesomeIcon icon={faTicketAlt} /> Auto‑create tickets from contact form: Yes</p>
        <p>Default priority: Medium</p>
      </div>
    </div>
  );
}