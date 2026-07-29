import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';
import { useAdminStore } from '../store/authStore';

function IconHexagon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }}>
      <path d="M16 3L29 10v12L16 29 3 22V10L16 3z" fill="#000" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 13, height: 13, flexShrink: 0 }}>
      <rect x="2.5" y="7" width="11" height="7.5" rx="1.5" />
      <path d="M5 7V5a3 3 0 116 0v2" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      const res: any = await adminApi.login(email, password);
      setAuth(res.admin, res.accessToken);
      toast.success('Welcome to Admin Panel');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-bg)',
    }}>
      {/* Left accent panel */}
      <div style={{
        width: '340px',
        flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-80px',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: 'auto' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconHexagon />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>DriverConnect</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Manage your<br />platform
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Review KYC applications, monitor live bookings, and oversee drivers and customers from a single dashboard.
          </p>
        </div>

        {[
          { label: 'KYC Reviews', desc: 'Approve driver documents' },
          { label: 'Live Bookings', desc: 'Monitor active rides' },
          { label: 'Driver Management', desc: 'Suspend & manage drivers' },
        ].map(({ label, desc }) => (
          <div key={label} style={{
            display: 'flex', gap: '0.625rem', alignItems: 'center',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.375rem',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-primary)', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }} className="animate-fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>Sign in</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Enter your admin credentials to continue
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="input-label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="admin@driverconnect.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleLogin}
            disabled={loading}
            style={{ marginBottom: '1rem' }}
          >
            {loading && <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{
            padding: '0.75rem',
            background: 'var(--color-primary-subtle)',
            border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3px' }}>
              <IconLock />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                Default credentials (seed data)
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', paddingLeft: '17px' }}>
              admin@driverconnect.com &nbsp;/&nbsp; AdminPass@123
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.68rem', color: 'var(--color-text-disabled)' }}>
            Admin access only — not publicly linked
          </p>
        </div>
      </div>
    </div>
  );
}
