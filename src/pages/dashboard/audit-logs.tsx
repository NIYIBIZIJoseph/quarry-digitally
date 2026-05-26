import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/lib/auth-client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const res = await fetch(`/api/audit?page=${page}&limit=30`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok) {
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    }
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">User ID</th>
                    <th className="px-4 py-2 border">Action</th>
                    <th className="px-4 py-2 border">Target</th>
                    <th className="px-4 py-2 border">Old Data</th>
                    <th className="px-4 py-2 border">New Data</th>
                    <th className="px-4 py-2 border">IP Address</th>
                    <th className="px-4 py-2 border">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 border">{log.user_id || 'system'}</td>
                      <td className="px-4 py-2 border">{log.action}</td>
                      <td className="px-4 py-2 border">{log.target_type}#{log.target_id}</td>
                      <td className="px-4 py-2 border text-xs">
                        <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                      </td>
                      <td className="px-4 py-2 border text-xs">
                        <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                      </td>
                      <td className="px-4 py-2 border">{log.ip_address}</td>
                      <td className="px-4 py-2 border">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => p+1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}