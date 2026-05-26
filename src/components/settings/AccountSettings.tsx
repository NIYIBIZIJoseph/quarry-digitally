import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';

export default function AccountSettings() {
  return (
    <div>
      <h2><FontAwesomeIcon icon={faUser} /> Account Settings</h2>
      <p>Manage your profile information, change password, and configure two‑factor authentication.</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <p><strong>Name:</strong> Admin User</p>
        <p><strong>Email:</strong> admin@hengyun.com</p>
        <button style={{ marginTop: '1rem', background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faKey} /> Change Password
        </button>
      </div>
    </div>
  );
}