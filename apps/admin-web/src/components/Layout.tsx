import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/authStore';
import { adminApi } from '../lib/api';
import toast from 'react-hot-toast';

/* ── SVG icon primitives (inline, no emoji) ────────────────────────── */
function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon">
      <path d="M8 1.5L2 4v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z" />
      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCar() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon">
      <path d="M3 9l1.5-4.5h7L13 9" strokeLinecap="round" />
      <rect x="1.5" y="9" width="13" height="4.5" rx="1.5" />
      <circle cx="4.5" cy="13.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="13.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13.5c0-2.5 2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M14.5 13.5c0-2-1.2-3.2-3-3.5" strokeLinecap="round" />
    </svg>
  );
}
function IconDriver() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="nav-icon">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" strokeLinecap="round" />
      <path d="M10.5 11l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 8H6" strokeLinecap="round" />
    </svg>
  );
}
function IconHexagon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 16, height: 16, color: '#000' }}>
      <path d="M8 1.5l5.5 3.25v6.5L8 14.5 2.5 11.25v-6.5L8 1.5z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { path: '/', icon: <IconGrid />,   label: 'Dashboard', exact: true },
  { path: '/kyc',      icon: <IconShield />, label: 'KYC Queue' },
  { path: '/bookings', icon: <IconCar />,    label: 'Bookings' },
  { path: '/drivers',  icon: <IconDriver />, label: 'Drivers' },
  { path: '/customers',icon: <IconUsers />,  label: 'Customers' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { admin, clearAuth } = useAdminStore();

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Signed out');
  };

  return (
    <div className="admin-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconHexagon />
          </div>
          <div>
            <div className="sidebar-logo-text">DriverConnect</div>
            <div className="sidebar-logo-sub">Admin</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {NAV_ITEMS.map(({ path, icon, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin?.name || 'Admin'}
              </div>
              <div className="sidebar-user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin?.email}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-full"
            onClick={handleLogout}
            style={{ fontSize: '0.72rem', gap: '0.4rem' }}
          >
            <IconLogout />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            DriverConnect Admin &nbsp;·&nbsp;
            <span>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <div className="topbar-right">
            <div className="status-dot" />
            <span className="topbar-status">All systems operational</span>
          </div>
        </div>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
