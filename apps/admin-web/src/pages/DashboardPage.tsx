import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/api';

/* ── Icon components ────────────────────────────────────────────────── */
function IconUsers({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 14, height: 14 }}>
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13.5c0-2.5 2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M14.5 13.5c0-2-1.2-3.2-3-3.5" strokeLinecap="round" />
    </svg>
  );
}
function IconShield({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 14, height: 14 }}>
      <path d="M8 1.5L2 4v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z" />
      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCar({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 14, height: 14 }}>
      <path d="M3 9l1.5-4.5h7L13 9" strokeLinecap="round" />
      <rect x="1.5" y="9" width="13" height="4.5" rx="1.5" />
      <circle cx="4.5" cy="13.5" r="1" fill={color} stroke="none" />
      <circle cx="11.5" cy="13.5" r="1" fill={color} stroke="none" />
    </svg>
  );
}
function IconCoin({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 14, height: 14 }}>
      <circle cx="8" cy="8" r="6" />
      <path d="M6 8h4M8 6v4" strokeLinecap="round" />
    </svg>
  );
}
function IconX({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2"
      style={{ width: 12, height: 12 }}>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}
function IconDriver({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 14, height: 14 }}>
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 12, height: 12, marginLeft: 'auto' }}>
      <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((data) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Total Drivers',     value: stats.totalDrivers,    sub: `${stats.onlineDrivers} online now`, color: '#0D9488', icon: <IconDriver  color="#0D9488" />, bg: 'rgba(13,148,136,0.12)' },
    { label: 'Verified Drivers',  value: stats.verifiedDrivers, sub: `${stats.pendingKyc} pending KYC`,  color: '#10B981', icon: <IconShield  color="#10B981" />, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Total Customers',   value: stats.totalCustomers,  sub: 'Registered users',                 color: '#818CF8', icon: <IconUsers   color="#818CF8" />, bg: 'rgba(129,140,248,0.12)' },
    { label: "Today's Bookings",  value: stats.todayBookings,   sub: `${stats.activeBookings} active`,   color: '#F59E0B', icon: <IconCar     color="#F59E0B" />, bg: 'rgba(245,158,11,0.12)' },
    { label: "Today's Revenue",   value: `\u20B9${stats.todayRevenue || 0}`, sub: 'Gross fare total',  color: '#10B981', icon: <IconCoin    color="#10B981" />, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Cancelled Today',   value: stats.cancelledToday || 0, sub: 'Cancellations',             color: '#EF4444', icon: <IconX       color="#EF4444" />, bg: 'rgba(239,68,68,0.12)' },
  ] : [];

  const ACTIONS = [
    { label: 'Review KYC Queue',  path: '/kyc',      badge: stats?.pendingKyc || 0, icon: <IconShield color="currentColor" /> },
    { label: 'View Live Bookings',path: '/bookings',  badge: 0, icon: <IconCar color="currentColor" /> },
    { label: 'Manage Drivers',    path: '/drivers',   badge: 0, icon: <IconDriver color="currentColor" /> },
    { label: 'All Customers',     path: '/customers', badge: 0, icon: <IconUsers color="currentColor" /> },
  ];

  const SERVICES = [
    { label: 'API Server',  status: 'operational' },
    { label: 'Database',    status: 'operational' },
    { label: 'WebSocket',   status: 'operational' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time platform overview</p>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="kpi-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{ height: 96 }} />
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          {kpis.map(({ label, value, sub, color, icon, bg }) => (
            <div key={label} className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-label">{label}</div>
                <div className="kpi-icon" style={{ background: bg }}>
                  {icon}
                </div>
              </div>
              <div className="kpi-value" style={{ color }}>{value}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom two-column panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Quick Actions */}
        <div className="action-panel">
          <div className="action-panel-header">
            Quick Actions
          </div>
          <div className="action-panel-body">
            {ACTIONS.map(({ label, path, badge, icon }) => (
              <button
                key={path}
                className="action-item"
                onClick={() => navigate(path)}
              >
                <span style={{ color: 'var(--color-text-muted)', width: 16, height: 16, flexShrink: 0 }}>
                  {icon}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    background: 'var(--color-warning)',
                    color: '#000',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                  }}>
                    {badge}
                  </span>
                )}
                <IconArrowRight />
              </button>
            ))}
          </div>
        </div>

        {/* Platform Status */}
        <div className="action-panel">
          <div className="action-panel-header">
            Platform Status
          </div>
          <div style={{ padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {SERVICES.map(({ label, status }) => (
              <div key={label} className="system-status-row">
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
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
