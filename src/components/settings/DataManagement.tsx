import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from "@/lib/roles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faDownload, faTrashAlt, faRecycle, 
  faSave, faEye, faTrash, faUndo, faCheckSquare, 
  faSquare, faLayerGroup, faClock, faTable
} from '@fortawesome/free-solid-svg-icons';

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
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [recycleLoading, setRecycleLoading] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const userRole = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}').role
    : null;

  const canEdit = userRole === ROLES.SUPERADMIN;

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/data-management/tables', {
        headers: getAuthHeaders(),
      });
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
      const res = await fetch('/api/admin/recycle-bin', {
        headers: getAuthHeaders(),
      });
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

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const exportTable = async () => {
    if (!canEdit) return;
    setExportLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `/api/settings/data-management/export?table=${selectedTable}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error('Export failed');

      const data = await res.json();

      if (data.length === 0) {
        showMessage(t('noDataToExport') || 'No data to export', 'error');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: Record<string, any>) =>
          headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
        ),
      ];

      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_export_${new Date().toISOString().slice(0, 19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage(t('exportCompleted') || 'Export completed');
    } catch (err: any) {
      showMessage(`${t('exportError') || 'Export error'}: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const purgeOldRecords = async () => {
    if (!canEdit) return;

    if (!confirm(
      `⚠️ WARNING: This will permanently delete records older than ${purgeDays} days from "${selectedTable}" table.\n\nThis action CANNOT be undone. Are you sure?`
    )) return;

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

      showMessage(`✅ Purged ${result.deleted} records from ${selectedTable}`);
      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      showMessage(`${t('purgeError') || 'Purge error'}: ${err.message}`, 'error');
    } finally {
      setPurgeLoading(false);
    }
  };

  const cleanupSoftDeleted = async () => {
    if (!canEdit) return;

    if (!confirm(
      `⚠️ WARNING: This will permanently delete soft-deleted records older than ${softDeleteDays} days from "${selectedTable}" table.\n\nThis action CANNOT be undone. Are you sure?`
    )) return;

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

      showMessage(`✅ Cleaned up ${result.deleted} soft-deleted records from ${selectedTable}`);
      fetchTables();
      fetchRecycleBin();
    } catch (err: any) {
      showMessage(`${t('cleanupError') || 'Cleanup error'}: ${err.message}`, 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    if (!confirm(`Restore ${item.name}?`)) return;

    setActionLoading(item.id);
    try {
      const res = await fetch(
        `/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=restore`,
        { method: 'POST', headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Restore failed');
      showMessage(`${item.name} restored successfully`);
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const permanentDeleteItem = async (item: DeletedItem) => {
    if (!confirm(`⚠️ Permanently delete ${item.name}? This cannot be undone.`)) return;

    setActionLoading(item.id);
    try {
      const res = await fetch(
        `/api/admin/recycle-bin?type=${item.type}&id=${item.id}&action=permanent`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Delete failed');
      showMessage(`${item.name} permanently deleted`);
      await fetchRecycleBin();
      await fetchTables();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(deletedItems.map(i => `${i.type}-${i.id}`)));
  };

  const deselectAll = () => setSelectedItems(new Set());

  const bulkDelete = async () => {
    if (!selectedItems.size) return alert('No items selected');
    if (!confirm(`⚠️ Permanently delete ${selectedItems.size} items? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      const items = Array.from(selectedItems).map(k => {
        const [type, id] = k.split('-');
        return { type, id: Number(id) };
      });

      const res = await fetch('/api/admin/recycle-bin/bulk-delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Bulk delete failed');

      showMessage(`✅ ${selectedItems.size} items permanently deleted`);
      await fetchRecycleBin();
      setSelectedItems(new Set());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loadingDataManagement') || 'Loading data management...'}</div>;
  if (error) return <div style={{ color: '#dc2626', padding: '1rem' }}>{error}</div>;

  const getTableCount = (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    return table?.count || 0;
  };

  return (
    <div>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <FontAwesomeIcon icon={faDatabase} /> {t('dataManagement') || 'Data Management'}
      </h3>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Export, purge, and manage your database records. ⚠️ Warning: Some actions are permanent and cannot be undone.
      </p>

      {message && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '12px', 
          background: messageType === 'success' ? '#d1fae5' : '#fee2e2', 
          borderRadius: '8px', 
          color: messageType === 'success' ? '#065f46' : '#dc2626' 
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Export Data Section */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faDownload} /> {t('exportData') || 'Export Data'}
          </h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{t('selectTable') || 'Select Table'}</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            >
              {tables.map(table => (
                <option key={table.name} value={table.name}>
                  {table.name} ({table.count} {t('records') || 'records'})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportTable}
            disabled={exportLoading || !canEdit}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FontAwesomeIcon icon={faDownload} /> {exportLoading ? (t('exporting') || 'Exporting...') : (t('exportToCsv') || 'Export to CSV')}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Export table data as CSV file for backup or analysis.
          </p>
        </div>

        {/* Purge Old Records Section */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
            <FontAwesomeIcon icon={faTrashAlt} /> {t('purgeOldRecords') || 'Purge Old Records'}
          </h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              {t('deleteRecordsOlderThan') || 'Delete records older than (days)'}
            </label>
            <input
              type="number"
              value={purgeDays}
              onChange={(e) => setPurgeDays(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{t('selectTable') || 'Select Table'}</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            >
              {tables.map(table => (
                <option key={table.name} value={table.name}>{table.name} ({table.count} records)</option>
              ))}
            </select>
          </div>
          <button
            onClick={purgeOldRecords}
            disabled={purgeLoading || !canEdit}
            style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FontAwesomeIcon icon={faTrash} /> {purgeLoading ? (t('purging') || 'Purging...') : (t('purgeOldRecords') || 'Purge Old Records')}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            ⚠️ Permanently delete records older than specified days.
          </p>
        </div>

        {/* Cleanup Soft-Deleted Section */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faRecycle} /> {t('cleanupSoftDeleted') || 'Cleanup Soft-Deleted Records'}
          </h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              {t('deleteSoftDeletedOlderThan') || 'Delete soft-deleted records older than (days)'}
            </label>
            <input
              type="number"
              value={softDeleteDays}
              onChange={(e) => setSoftDeleteDays(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <button
            onClick={cleanupSoftDeleted}
            disabled={cleanupLoading || !canEdit}
            style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FontAwesomeIcon icon={faSave} /> {cleanupLoading ? (t('cleaning') || 'Cleaning...') : (t('cleanupSoftDeleted') || 'Cleanup Soft-Deleted')}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Permanently remove soft-deleted records older than specified days.
          </p>
        </div>
      </div>

      {/* Recycle Bin Section */}
      <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faRecycle} /> {t('recycleBin') || 'Recycle Bin'}
          </h4>
          {deletedItems.length > 0 && canEdit && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={selectAll} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faCheckSquare} /> {t('selectAll') || 'Select All'}
              </button>
              <button onClick={deselectAll} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faSquare} /> {t('deselectAll') || 'Deselect All'}
              </button>
              {selectedItems.size > 0 && (
                <button onClick={bulkDelete} disabled={bulkLoading} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTrash} /> {bulkLoading ? (t('deleting') || 'Deleting...') : `${t('deleteSelected') || 'Delete Selected'} (${selectedItems.size})`}
                </button>
              )}
            </div>
          )}
        </div>

        {recycleLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>{t('loadingDeletedItems') || 'Loading deleted items...'}</div>
        ) : deletedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>{t('noDeletedItems') || 'No deleted items found.'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('type') || 'Type'}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('nameIdentifier') || 'Name / Identifier'}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('deletedAt') || 'Deleted At'}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('deletedBy') || 'Deleted By'}</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(`${item.type}-${item.id}`)}
                        onChange={() => toggleSelectItem(`${item.type}-${item.id}`)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>{item.type}</td>
                    <td style={{ padding: '12px' }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>{new Date(item.deleted_at).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{item.deleted_by || 'System'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => restoreItem(item)}
                          disabled={actionLoading === item.id}
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                          title={t('restore') || 'Restore'}
                        >
                          <FontAwesomeIcon icon={faUndo} /> {t('restore') || 'Restore'}
                        </button>
                        <button
                          onClick={() => permanentDeleteItem(item)}
                          disabled={actionLoading === item.id}
                          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                          title={t('permanentDelete') || 'Permanent Delete'}
                        >
                          <FontAwesomeIcon icon={faTrash} /> {t('delete') || 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}