import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faMoneyBillWave, faUsers, faShoppingCart, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function BranchPerformance() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/branch-performance', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setBranches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '2rem', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> {t('loading')}
      </div>
    );
  }

  if (branches.length === 0) return null;

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '2rem' }}>
      <h3>
        <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#f59e0b' }} />
        {t('branchPerformance')}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '6px' }} />
                {t('branch')}
              </th>
              <th style={{ padding: '12px', textAlign: 'right' }}>
                <FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '6px' }} />
                {t('revenue')} (RWF)
              </th>
              <th style={{ padding: '12px', textAlign: 'right' }}>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: '6px' }} />
                {t('attendance')} (%)
              </th>
              <th style={{ padding: '12px', textAlign: 'right' }}>
                <FontAwesomeIcon icon={faShoppingCart} style={{ marginRight: '6px' }} />
                {t('orders')}
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>
                  <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#6b7280' }} />
                  {b.branch}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {b.revenue?.toLocaleString() || 0}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <span style={{
                    background: (b.attendance || 0) >= 80 ? '#d1fae5' : (b.attendance || 0) >= 60 ? '#fef3c7' : '#fee2e2',
                    color: (b.attendance || 0) >= 80 ? '#065f46' : (b.attendance || 0) >= 60 ? '#92400e' : '#991b1b',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                  }}>
                    {b.attendance || 0}%
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {b.orders || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}