import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faMoneyBillWave, faClock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function BusinessKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    revenue: 0, 
    monthlyRevenue: 0, 
    pendingOrders: 0 
  });

  useEffect(() => {
    fetch('/api/dashboard/stats', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const cards = [
    { label: t('totalOrders'), value: stats.totalOrders, sub: '', icon: faShoppingCart, color: '#fff' },
    { label: t('revenue'), value: stats.revenue?.toLocaleString() || 0, sub: `${t('monthly')}: ${stats.monthlyRevenue?.toLocaleString() || 0}`, icon: faMoneyBillWave, color: '#fff' },
    { label: t('pendingOrders'), value: stats.pendingOrders, sub: t('needsAction'), icon: faClock, color: '#fef3c7' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{ background: card.color, padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#4b5563', fontSize: '0.85rem' }}>
            <FontAwesomeIcon icon={card.icon} fixedWidth /> {card.label}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{card.value}</div>
          {card.sub && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}