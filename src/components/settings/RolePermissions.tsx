import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faUsers } from '@fortawesome/free-solid-svg-icons';

export default function RolePermissions() {
  return (
    <div>
      <h2><FontAwesomeIcon icon={faShieldAlt} /> Roles & Permissions</h2>
      <p>Define user roles and granular access permissions.</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <p><FontAwesomeIcon icon={faUsers} /> Superadmin – full system access</p>
        <p><FontAwesomeIcon icon={faUsers} /> Admin – manage inventory, orders, support</p>
        <p><FontAwesomeIcon icon={faUsers} /> Supervisor – view attendance, approve tickets</p>
        <p><FontAwesomeIcon icon={faUsers} /> Worker – limited self‑service</p>
      </div>
    </div>
  );
}