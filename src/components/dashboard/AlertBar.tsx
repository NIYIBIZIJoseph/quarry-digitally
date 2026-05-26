import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faBoxOpen, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

export default function AlertBar() {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const headers = getAuthHeaders();
      try {
        // Products low stock
        const productsRes = await fetch('/api/products', { headers });
        const productsData = await productsRes.json();
        // ✅ Safely extract array
        const products = Array.isArray(productsData) ? productsData : (productsData.data || []);
        const lowStockCount = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5) && p.stock_quantity > 0).length;

        // Open tickets
        const ticketsRes = await fetch('/api/support/tickets', { headers });
        const ticketsData = await ticketsRes.json();
        const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []);
        const openTicketsCount = tickets.filter((t: any) => t.status !== 'closed').length;

        const newAlerts: string[] = [];
        if (lowStockCount > 0) newAlerts.push(`${lowStockCount} product(s) low on stock`);
        if (openTicketsCount > 0) newAlerts.push(`${openTicketsCount} open support ticket(s)`);
        setAlerts(newAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };
    fetchAlerts();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem' }}>
      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px', color: '#f59e0b' }} />
      <span>{alerts.join(' • ')}</span>
    </div>
  );
}