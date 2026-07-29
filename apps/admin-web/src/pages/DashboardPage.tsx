import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((data) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Total Drivers', value: stats.totalDrivers, sub: `${stats.onlineDrivers} online now`, icon: '🚗', color: '#0D9488' },
    { label: 'Verified Drivers', value: stats.verifiedDrivers, sub: `${stats.pendingKyc} pending KYC`, icon: '✅', color: '#10B981' },
    { label: 'Total Customers', value: stats.totalCustomers, sub: 'Registered users', icon: '👥', color: '#818CF8' },
    { label: "Today's Bookings", value: stats.todayBookings, sub: `${stats.activeBookings} active`, icon: '📋', color: '#F59E0B' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue || 0}`, sub: 'Gross fare total', icon: '💰', color: '#10B981' },
    { label: 'Cancelled Today', value: stats.cancelledToday || 0, sub: 'Cancellations', icon: '❌', color: '#EF4444' },
  ] : [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Real-time platform overview</p>
      </div>

      {loading ? (
        <div className="kpi-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
        </div>
      ) : (
        <div className="kpi-grid">
          {kpis.map(({ label, value, sub, icon, color }) => (
            <div key={label} className="kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi-label">{label}</div>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              </div>
              <div className="kpi-value" style={{ color }}>{value}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div className="table-container">
          <div className="table-header" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>⚡ Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/kyc')}>
              📋 Review KYC Queue
              {stats?.pendingKyc > 0 && (
                <span style={{ marginLeft: 'auto', background: '#F59E0B', color: '#000', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.65rem', fontWeight: 700 }}>
                  {stats.pendingKyc}
                </span>
              )}
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/bookings')}>
              🚗 View Live Bookings
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/drivers')}>
              👨‍💼 Manage Drivers
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>📊 Platform Status</h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'API Server', status: 'operational' },
              { label: 'MongoDB', status: 'operational' },
              { label: 'WebSocket', status: 'operational' },
            ].map(({ label, status }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{label}</span>
                <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600, background: 'var(--color-success-bg)', color: '#10B981' }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
