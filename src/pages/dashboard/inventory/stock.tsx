import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faExclamationTriangle, faCheckCircle, faTimesCircle,
  faChartLine, faPlus, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
  id: number;
  name: string;
  category_name: string;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
}

interface TopProduct {
  name: string;
  total_sold: number;
}

export default function StockOverview() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [restockReason, setRestockReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProducts = async () => {
    const res = await fetch('/api/products', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : (data.data || []));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchProducts();
        const topRes = await fetch('/api/dashboard/top-products', { headers: getAuthHeaders() });
        if (topRes.ok) {
          const topData = await topRes.json();
          const topDataArray = Array.isArray(topData) ? topData : (topData.data || []);
          setTopProducts(topDataArray.slice(0, 5));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRestock = async (product: Product) => {
    if (!restockQuantity || restockQuantity <= 0) {
      alert(t('validQuantityRequired') || 'Please enter a valid quantity');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('/api/stock/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: product.id,
          quantity: restockQuantity,
          reason: restockReason || (t('manualRestock') || 'Manual restock'),
        }),
      });
      if (res.ok) {
        await fetchProducts();
        setRestockProduct(null);
        setRestockQuantity(0);
        setRestockReason('');
        alert(t('stockAddedSuccess') || 'Stock added successfully');
      } else {
        const err = await res.json();
        alert(err.error || t('restockFailed') || 'Restock failed');
      }
    } catch (err) {
      alert(t('errorRestocking') || 'Error restocking');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <DashboardLayout>{t('loadingStock') || 'Loading stock overview...'}</DashboardLayout>;
  if (error) return <DashboardLayout>{t('error') || 'Error'}: {error}</DashboardLayout>;

  const lowStockCount = products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('stockOverview') || 'Stock Overview'}</h1>
        <button onClick={() => window.history.back()} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('back') || 'Back'}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <FontAwesomeIcon icon={faBox} /> {t('totalProducts') || 'Total Products'}
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{products.length}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {t('lowStock') || 'Low Stock'}
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#dc2626' }}>{lowStockCount}</div>
        </div>
        <div style={{ background: '#fecaca', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
          <FontAwesomeIcon icon={faTimesCircle} /> {t('outOfStock') || 'Out of Stock'}
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b91c1c' }}>{outOfStockCount}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <FontAwesomeIcon icon={faChartLine} /> {t('totalStockUnits') || 'Total Stock Units'}
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalStockUnits}</div>
        </div>
      </div>

      {/* Fast-Moving Products */}
      {topProducts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <FontAwesomeIcon icon={faChartLine} /> {t('fastMovingProducts') || 'Fast-Moving Products (Last 30 days)'}
          </h2>
          <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>
            {topProducts.map((p, idx) => {
              const product = products.find(prod => prod.name === p.name);
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span><strong>{p.name}</strong> – {p.total_sold} {t('unitsSold') || 'units sold'}</span>
                  {product && (
                    <button
                      onClick={() => setRestockProduct(product)}
                      style={{ background: '#f59e0b', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> {t('restock') || 'Restock'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>{t('restockRecommendation') || 'Consider restocking these products first.'}</p>
        </div>
      )}

      {/* All Products */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>{t('allProductsStock') || 'All Products Stock'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {products.map(product => {
          const isOut = product.stock_quantity === 0;
          const isLow = product.stock_quantity <= product.reorder_level && product.stock_quantity > 0;
          return (
            <div key={product.id} style={{ background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: isOut ? '4px solid #dc2626' : (isLow ? '4px solid #f59e0b' : '4px solid #10b981') }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{product.name}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{product.category_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span>{t('stockLabel') || 'Stock'}: <strong>{product.stock_quantity}</strong> {t('units') || 'units'}</span>
                <span>{t('reorderLevel') || 'Reorder'}: {product.reorder_level}</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {isOut ? (
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                      <FontAwesomeIcon icon={faTimesCircle} /> {t('outOfStock') || 'Out of Stock'}
                    </span>
                  ) : isLow ? (
                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} /> {t('lowStock') || 'Low Stock'}
                    </span>
                  ) : (
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                      <FontAwesomeIcon icon={faCheckCircle} /> {t('inStock') || 'In Stock'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setRestockProduct(product)}
                  style={{ background: '#f59e0b', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faPlus} /> {t('restock') || 'Restock'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3>{t('restockProduct') || 'Restock'} {restockProduct.name}</h3>
            <input
              type="number"
              placeholder={t('quantityToAdd') || 'Quantity to add (units)'}
              value={restockQuantity}
              onChange={e => setRestockQuantity(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '8px', margin: '12px 0', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder={t('reasonOptional') || 'Reason (optional)'}
              value={restockReason}
              onChange={e => setRestockReason(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRestockProduct(null)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }} disabled={updating}>
                {t('cancel') || 'Cancel'}
              </button>
              <button onClick={() => handleRestock(restockProduct)} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }} disabled={updating}>
                {updating ? (t('adding') || 'Adding...') : <><FontAwesomeIcon icon={faPlus} /> {t('addStock') || 'Add Stock'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}