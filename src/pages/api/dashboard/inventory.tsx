import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';

interface Product {
  id: number;
  name: string;
  category_name: string;
  price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        setFiltered(data);
        // Extract unique categories – fixed line 34
        const cats = [...new Set(data.map((p: Product) => p.category_name).filter(Boolean))] as string[];
        setCategories(cats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filteredList = products;
    if (search.trim()) {
      filteredList = filteredList.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filteredList = filteredList.filter(p => p.category_name === categoryFilter);
    }
    setFiltered(filteredList);
  }, [search, categoryFilter, products]);

  const totalStockValue = filtered.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Price (RWF)', 'Stock', 'Reorder Level', 'Status'];
    const rows = filtered.map(p => [
      p.name,
      p.category_name || '',
      p.price,
      p.stock_quantity,
      p.reorder_level,
      p.stock_quantity <= p.reorder_level ? 'Low Stock' : 'OK'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <DashboardLayout>Loading inventory...</DashboardLayout>;
  if (error) return <DashboardLayout>Error: {error}</DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Inventory Management</h1>
        <button onClick={exportToCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          📄 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by product name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Summary Card */}
      <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <strong>Total Inventory Value:</strong> {totalStockValue.toLocaleString()} RWF
      </div>

      {/* Products Table */}
      {filtered.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Price (RWF)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Reorder Level</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{p.name}</td>
                  <td style={{ padding: '12px' }}>{p.category_name || '-'}</td>
                  <td style={{ padding: '12px' }}>{p.price.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{p.stock_quantity}</td>
                  <td style={{ padding: '12px' }}>{p.reorder_level}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: p.stock_quantity <= p.reorder_level ? '#fee2e2' : '#d1fae5',
                      color: p.stock_quantity <= p.reorder_level ? '#b91c1c' : '#065f46',
                      padding: '4px 8px',
                      borderRadius: '20px',
                      fontSize: '0.75rem'
                    }}>
                      {p.stock_quantity <= p.reorder_level ? '⚠️ Low Stock' : '✅ In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}