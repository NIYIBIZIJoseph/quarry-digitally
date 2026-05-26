import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';

interface TableInfo {
  name: string;
  count: number;
}

interface DeletedItem {
  id: number;
  name: string;
  type: string;
  deleted_at: string;
  deleted_by: number | null;
}

export default function DataManagementSettings() {
  const { t } = useTranslation();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('orders');
  const [purgeDays, setPurgeDays] = useState<number>(365);
  const [softDeleteDays, setSoftDeleteDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);
  const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [recycleLoading, setRecycleLoading] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}').role) : null;
  const canEdit = userRole === 'superadmin';

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/data-management/tables', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch tables');
      const data = await res.json();
      setTables(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecycleBin = async () => {
    setRecycleLoading(true);
    try {
      const res = await fetch('/api/admin/recycle-bin', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch deleted items');
      const data = await res.json();
      setDeletedItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRecycleLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRecycleBin();
  }, []);

  const exportTable = async () => {
    if (!canEdit) return;
    setExportLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/settings/data-management/export?table=${selectedTable}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      if (data.length === 0) {
        setMessage(t('noDataToExport') || 'No data to export');
        setExportLoading(false);
        return;
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: Record<string, any>) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
      ];
      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export_${new Date().toISOString().slice(0,19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(t('exportCompleted') || 'Export completed');
    } catch (err: any) {
      setMessage(`${t('exportError') || 'Export error'}: ${err.message}`);
    } finally {
      setExportLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const purgeOldRecords = async () => {
    if (!canEdit) return;
    if (!confirm(t('confirmPurge')?.replace('{days}', purgeDays.toString()).replace('{table}', selectedTable) || `Permanently delete records older than ${purgeDays} days from ${selectedTable}? This action cannot be undone.`)) return;
    setPurgeLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings/data-management/purge', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ table: selectedTable, days: purgeDays }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Purge failed');
      setMessage(t('purgedRecords')?.replace('{count}', result.deleted).replace('{table}', selectedTable) || `Purged ${result.deleted} records from ${selectedTable}`);
      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      setMessage(`${t('purgeError') || 'Purge error'}: ${err.message}`);
    } finally {
      setPurgeLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const cleanupSoftDeleted = async () => {
    if (!canEdit) return;
    if (!confirm(t('confirmCleanup')?.replace('{days}', softDeleteDays.toString()).replace('{table}', selectedTable) || `Permanently delete soft‑deleted records older than ${softDeleteDays} days from ${selectedTable}? This action cannot be undone.`)) return;
    setCleanupLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings/data-management/cleanup-soft-deleted', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ table: selectedTable, days: softDeleteDays }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Cleanup failed');
      setMessage(t('cleanedUpRecords')?.replace('{count}', result.deleted).replace('{table}', selectedTable) || `Cleaned up ${result.deleted} soft‑deleted records from ${selectedTable}`);
      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      setMessage(`${t('cleanupError') || 'Cleanup error'}: ${err.message}`);
    } finally {
      setCleanupLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    if (!confirm(t('confirmRestore')?.replace('{type}', item.type).replace('{name}', item.name) || `Restore ${item.type} "${item.name}"?`)) return;
    setActionLoading(item.id);
    try {
      const res = await fetch(`/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Restore failed');
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(`${t('restoreError') || 'Restore error'}: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const permanentDeleteItem = async (item: DeletedItem) => {
    if (!confirm(t('confirmPermanentDelete')?.replace('{type}', item.type).replace('{name}', item.name) || `Permanently delete ${item.type} "${item.name}"? This action cannot be undone.`)) return;
    setActionLoading(item.id);
    try {
      const res = await fetch(`/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=permanent`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Permanent delete failed');
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(`${t('deleteError') || 'Delete error'}: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) newSet.delete(itemKey);
      else newSet.add(itemKey);
      return newSet;
    });
  };

  const selectAll = () => {
    const allKeys = deletedItems.map(item => `${item.type}-${item.id}`);
    setSelectedItems(new Set(allKeys));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const bulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert(t('noItemsSelected') || 'No items selected');
      return;
    }
    if (!confirm(t('confirmBulkDelete')?.replace('{count}', selectedItems.size.toString()) || `Delete ${selectedItems.size} item(s) permanently? This action cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const itemsToDelete = Array.from(selectedItems).map(key => {
        const [type, id] = key.split('-');
        return { type, id: parseInt(id) };
      });
      const res = await fetch('/api/admin/recycle-bin/bulk-delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: itemsToDelete }),
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      await fetchRecycleBin();
      await fetchTables();
      setSelectedItems(new Set());
      alert(t('bulkDeleteSuccess') || 'Selected items deleted');
    } catch (err: any) {
      alert(`${t('bulkDeleteError') || 'Bulk delete error'}: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) return <div>{t('loadingDataManagement') || 'Loading data management...'}</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{t('error') || 'Error'}: {error}</div>;

  return (
    <div>
      <h3>{t('dataManagement') || 'Data Management'}</h3>

      {/* Data Operations Section */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px' }}>{t('selectTable') || 'Select Table'}</label>
          <select
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
            disabled={!canEdit}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            {tables.map(table => (
              <option key={table.name} value={table.name}>
                {table.name} ({table.count} {t('records') || 'records'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <h4>{t('exportData') || 'Export Data'}</h4>
          <button
            onClick={exportTable}
            disabled={!canEdit || exportLoading}
            style={{ background: '#f59e0b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            {exportLoading ? (t('exporting') || 'Exporting...') : (t('exportToCsv') || 'Export to CSV')}
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <h4>{t('purgeOldRecords') || 'Purge Old Records (Permanent Delete)'}</h4>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('deleteRecordsOlderThan') || 'Delete records older than (days):'}</label>
            <input
              type="number"
              value={purgeDays}
              onChange={e => setPurgeDays(parseInt(e.target.value) || 0)}
              disabled={!canEdit}
              style={{ marginLeft: '8px', padding: '4px', width: '80px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            onClick={purgeOldRecords}
            disabled={!canEdit || purgeLoading}
            style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            {purgeLoading ? (t('purging') || 'Purging...') : (t('purgeOldRecords') || 'Purge Old Records')}
          </button>
        </div>

        <div style={{ marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <h4>{t('cleanupSoftDeleted') || 'Cleanup Soft‑Deleted Records'}</h4>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('deleteSoftDeletedOlderThan') || 'Delete soft‑deleted records older than (days):'}</label>
            <input
              type="number"
              value={softDeleteDays}
              onChange={e => setSoftDeleteDays(parseInt(e.target.value) || 0)}
              disabled={!canEdit}
              style={{ marginLeft: '8px', padding: '4px', width: '80px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            onClick={cleanupSoftDeleted}
            disabled={!canEdit || cleanupLoading}
            style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            {cleanupLoading ? (t('cleaning') || 'Cleaning...') : (t('cleanupSoftDeleted') || 'Cleanup Soft‑Deleted')}
          </button>
        </div>

        {message && <div style={{ marginTop: '1rem', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>{message}</div>}
      </div>

      {/* Recycle Bin Section */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>{t('recycleBin') || 'Recycle Bin'}</h3>
          {deletedItems.length > 0 && canEdit && (
            <div>
              <button onClick={selectAll} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('selectAll') || 'Select All'}</button>
              <button onClick={deselectAll} style={{ marginRight: '8px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>{t('deselectAll') || 'Deselect All'}</button>
              <button onClick={bulkDelete} disabled={bulkLoading} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                {bulkLoading ? (t('deleting') || 'Deleting...') : `${t('deleteSelected') || 'Delete Selected'} (${selectedItems.size})`}
              </button>
            </div>
          )}
        </div>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{t('recycleBinDescription') || 'Soft‑deleted items – restore or permanently delete.'}</p>
        {recycleLoading ? (
          <div>{t('loadingDeletedItems') || 'Loading deleted items...'}</div>
        ) : deletedItems.length === 0 ? (
          <div>{t('noDeletedItems') || 'No deleted items found.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('select') || 'Select'}</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('type') || 'Type'}</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('nameIdentifier') || 'Name / Identifier'}</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('deletedAt') || 'Deleted At'}</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('deletedBy') || 'Deleted By'}</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>{t('actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.map(item => {
                  const itemKey = `${item.type}-${item.id}`;
                  return (
                    <tr key={itemKey} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(itemKey)}
                          onChange={() => toggleSelectItem(itemKey)}
                          disabled={!canEdit}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>{item.type}</td>
                      <td style={{ padding: '8px' }}>{item.name}</td>
                      <td style={{ padding: '8px' }}>{new Date(item.deleted_at).toLocaleString()}</td>
                      <td style={{ padding: '8px' }}>{item.deleted_by || 'System'}</td>
                      <td style={{ padding: '8px' }}>
                        <button
                          onClick={() => restoreItem(item)}
                          disabled={actionLoading === item.id}
                          style={{ marginRight: '8px', background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {t('restore') || 'Restore'}
                        </button>
                        <button
                          onClick={() => permanentDeleteItem(item)}
                          disabled={actionLoading === item.id}
                          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {t('permanentDelete') || 'Permanent Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}