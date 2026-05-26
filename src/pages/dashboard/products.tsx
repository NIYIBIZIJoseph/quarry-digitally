import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';
import Papa from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrashAlt, faBoxOpen, 
  faBox, faExclamationTriangle, faCheckCircle, 
  faEye, faWarehouse, faChartLine, faFileExport, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price: number;
  stock_quantity: number;
  description: string;
  image_url: string;
  reorder_level: number;
  is_active: boolean;
  sku?: string;
  updated_at?: string;
}

export default function ProductsPortal() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    description: '',
    image_url: '',
    reorder_level: '20',
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { headers: getAuthHeaders() });
      const data = await res.json();
      const productArray = Array.isArray(data) ? data : (data.data || []);
      setProducts(productArray);
      applyFilters(productArray, search, categoryFilter, statusFilter);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { headers: getAuthHeaders() });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const applyFilters = (productsList: Product[], searchTerm: string, cat: string, stat: string) => {
    let filteredList = [...productsList];
    if (searchTerm) {
      filteredList = filteredList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (cat !== 'all') {
      filteredList = filteredList.filter(p => p.category_id.toString() === cat);
    }
    if (stat !== 'all') {
      if (stat === 'low') filteredList = filteredList.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0);
      else if (stat === 'out') filteredList = filteredList.filter(p => p.stock_quantity === 0);
      else if (stat === 'active') filteredList = filteredList.filter(p => p.is_active);
      else if (stat === 'inactive') filteredList = filteredList.filter(p => !p.is_active);
    }
    setFiltered(filteredList);
  };

  useEffect(() => {
    applyFilters(products, search, categoryFilter, statusFilter);
  }, [search, categoryFilter, statusFilter, products]);

  const exportToCSV = () => {
    const csvData = filtered.map(p => ({
      [t('productName')]: p.name,
      [t('category')]: p.category_name,
      [t('price')]: p.price,
      [t('stock')]: p.stock_quantity,
      [t('reorderLevel')]: p.reorder_level,
      [t('status')]: p.is_active ? t('active') : t('inactive'),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('productsExport')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setForm({ ...form, image_url: data.url });
      else setError(data.message || t('uploadFailed'));
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) {
      setError(t('nameCategoryRequired'));
      return;
    }
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    const payload = {
      name: form.name,
      category_id: parseInt(form.category_id),
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      description: form.description || '',
      image_url: form.image_url || '',
      reorder_level: parseInt(form.reorder_level) || 20,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchProducts();
        setShowModal(false);
        setEditingProduct(null);
        setForm({ name: '', category_id: '', price: '', stock_quantity: '', description: '', image_url: '', reorder_level: '20', is_active: true });
        setError('');
      } else {
        const err = await res.json();
        setError(err.message || t('saveFailed'));
      }
    } catch (err) {
      setError(t('networkError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category_id: product.category_id.toString(),
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || '',
      image_url: product.image_url || '',
      reorder_level: product.reorder_level.toString(),
      is_active: product.is_active,
    });
    setShowModal(true);
  };

  const getStockBadge = (product: Product) => {
    if (product.stock_quantity === 0) return { label: t('outOfStock'), color: '#dc2626', bg: '#fee2e2' };
    if (product.stock_quantity <= product.reorder_level) return { label: `${t('low')} (${product.stock_quantity})`, color: '#b45309', bg: '#fef3c7' };
    return { label: `${product.stock_quantity} ${t('cubicMeters')}`, color: '#065f46', bg: '#d1fae5' };
  };

  const inventoryValue = Array.isArray(products) ? products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0) : 0;
  const lowStockCount = Array.isArray(products) ? products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length : 0;
  const outOfStockCount = Array.isArray(products) ? products.filter(p => p.stock_quantity === 0).length : 0;

  if (loading) return <DashboardLayout>{t('loadingProducts')}</DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('products')}</h1>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
          <FontAwesomeIcon icon={faBox} /> {t('totalProducts')}
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</div>
        </div>
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {t('lowStock')}
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{lowStockCount}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '12px' }}>
          <FontAwesomeIcon icon={faBoxOpen} /> {t('outOfStock')}
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{outOfStockCount}</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
          <FontAwesomeIcon icon={faChartLine} /> {t('inventoryValue')}
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{inventoryValue.toLocaleString()} RWF</div>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> {t('lowStockAlert', { count: lowStockCount })}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder={t('searchByName')} value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px', width: '240px' }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="all">{t('allCategories')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="all">{t('allStock')}</option>
            <option value="low">{t('lowStock')}</option>
            <option value="out">{t('outOfStock')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToCSV} style={{ background: '#e5e7eb', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faFileExport} /> {t('exportCSV')}
          </button>
          <button onClick={() => { setEditingProduct(null); setForm({ name: '', category_id: categories[0]?.id.toString() || '', price: '', stock_quantity: '', description: '', image_url: '', reorder_level: '20', is_active: true }); setShowModal(true); }} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faPlus} /> {t('addProduct')}
          </button>
        </div>
      </div>

      {/* Product Table */}
      {filtered.length === 0 ? <p>{t('noProductsFound')}</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th>{t('productName')}</th>
                <th>{t('category')}</th>
                <th>{t('price')} (RWF)</th>
                <th>{t('stock')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stockBadge = getStockBadge(p);
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedProduct(p); setShowDrawer(true); }}>
                    <td style={{ padding: '12px' }}>{p.name}</td>
                    <td style={{ padding: '12px' }}>{p.category_name}</td>
                    <td style={{ padding: '12px' }}>{p.price?.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}><span style={{ background: stockBadge.bg, color: stockBadge.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>{stockBadge.label}</span></td>
                    <td style={{ padding: '12px' }}>{p.is_active ? <><FontAwesomeIcon icon={faCheckCircle} /> {t('active')}</> : t('inactive')}</td>
                    <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', marginRight: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faEdit} /> {t('edit')}</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}><FontAwesomeIcon icon={faTrashAlt} /> {t('delete')}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
        </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingProduct ? t('editProduct') : t('addProduct')}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder={t('productNameRequired')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required style={{ width: '100%', marginBottom: '12px', padding: '8px' }}>
                <option value="">{t('selectCategory')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" step="0.01" placeholder={t('priceRWF')} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="number" placeholder={t('stockQuantity')} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <input type="number" placeholder={t('reorderLevel')} value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <textarea placeholder={t('description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
              <div>
                <label>{t('productImage')}</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && <span><FontAwesomeIcon icon={faSpinner} spin /> {t('uploading')}</span>}
                {form.image_url && <img src={form.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '8px' }} />}
                <input type="text" placeholder={t('orEnterImageUrl')} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={{ width: '100%', marginTop: '8px', padding: '8px' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> {t('active')}
              </label>
              {error && <div style={{ color: 'red', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('cancel')}</button>
                <button type="submit" disabled={uploading} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Drawer */}
      {showDrawer && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '480px', height: '100%', background: 'white', boxShadow: '-4px 0 12px rgba(0,0,0,0.15)', zIndex: 1000, padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>{selectedProduct.name}</h2>
            <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <img src={selectedProduct.image_url || '/placeholder.jpg'} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' }} />
          <p><strong>{t('category')}:</strong> {selectedProduct.category_name}</p>
          <p><strong>{t('price')}:</strong> {selectedProduct.price?.toLocaleString()} RWF</p>
          <p><strong>{t('stock')}:</strong> {selectedProduct.stock_quantity} {t('cubicMeters')}</p>
          <p><strong>{t('reorderLevel')}:</strong> {selectedProduct.reorder_level} {t('cubicMeters')}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setEditingProduct(selectedProduct); setForm({ name: selectedProduct.name, category_id: selectedProduct.category_id.toString(), price: selectedProduct.price.toString(), stock_quantity: selectedProduct.stock_quantity.toString(), description: selectedProduct.description || '', image_url: selectedProduct.image_url || '', reorder_level: selectedProduct.reorder_level.toString(), is_active: selectedProduct.is_active }); setShowDrawer(false); setShowModal(true); }} style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              {t('editProduct')}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}