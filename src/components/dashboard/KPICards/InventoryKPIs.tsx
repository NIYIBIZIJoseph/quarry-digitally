import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faExclamationTriangle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function InventoryKPIs() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0 });

  useEffect(() => {
    fetch('/api/products', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(products => {
        const total = products.length;
        const low = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;
        const out = products.filter((p: any) => p.stock_quantity === 0).length;
        setStats({ totalProducts: total, lowStock: low, outOfStock: out });
      })
      .catch(console.error);
  }, []);

  const cards = [
    { label: t('totalProducts'), value: stats.totalProducts, icon: faBox, color: '#fff' },
    { label: t('lowStock'), value: stats.lowStock, sub: t('reorderSoon'), icon: faExclamationTriangle, color: '#fef3c7' },
    { label: t('outOfStock'), value: stats.outOfStock, sub: t('urgent'), icon: faBoxOpen, color: '#fee2e2' },
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