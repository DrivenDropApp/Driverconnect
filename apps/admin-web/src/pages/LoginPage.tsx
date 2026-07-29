import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';
import { useAdminStore } from '../store/authStore';

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
      toast.success('Welcome to Admin Panel!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{ width: '100%', maxWidth: '380px', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #D97706, #B45309)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
            boxShadow: '0 0 24px rgba(217,119,6,0.3)',
          }}>⚙️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E2E8F0' }}>Admin Panel</h1>
          <p style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.25rem' }}>DriverConnect Operations</p>
        </div>

        {/* Login Form */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>EMAIL</label>
              <input
                className="input"
                type="email"
                placeholder="admin@driverconnect.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%' }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>PASSWORD</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleLogin} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : null}
            {loading ? 'Signing in...' : 'Sign In to Admin'}
          </button>

          <div style={{ marginTop: '1.25rem', padding: '0.875rem', background: 'var(--color-primary-subtle)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600, marginBottom: '2px' }}>Default Credentials (seed data)</p>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>admin@driverconnect.com / AdminPass@123</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: '#475569' }}>
          🔒 Admin access only · Not publicly linked
        </p>
      </div>
    </div>
  );
}
