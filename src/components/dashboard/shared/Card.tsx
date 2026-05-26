export default function DashboardCard({ title, children, loading, error }: { title?: string; children: React.ReactNode; loading?: boolean; error?: string }) {
  if (loading) return <div className="skeleton" style={{ height: '150px' }} />;
  if (error) return <div style={{ color: 'red', padding: '1rem' }}>⚠️ {error}</div>;
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {title && <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>}
      {children}
    </div>
  );
}