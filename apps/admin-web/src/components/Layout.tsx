import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/authStore';
import { adminApi } from '../lib/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/kyc', icon: '📋', label: 'KYC Queue' },
  { path: '/bookings', icon: '🚗', label: 'Bookings' },
  { path: '/drivers', icon: '👨‍💼', label: 'Drivers' },
  { path: '/customers', icon: '👥', label: 'Customers' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { admin, clearAuth } = useAdminStore();

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">DriverConnect</div>
          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>Admin Panel</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #D97706, #B45309)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#E2E8F0' }}>{admin?.name || 'Admin'}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{admin?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full" onClick={handleLogout} style={{ fontSize: '0.75rem' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            DriverConnect Admin · <span style={{ color: '#E2E8F0' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>System Online</span>
          </div>
        </div>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
