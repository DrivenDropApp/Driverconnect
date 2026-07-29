import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, clearAuth, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data: any = await api.getProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: any = await api.updateProfile({ name, email });
      setProfile(updated);
      updateUser({ name, email });
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem' }}>← Home</button>
        <span style={{ fontWeight: 700 }}>My Profile</span>
        <button className="btn btn-ghost" onClick={() => setEditing(!editing)} style={{ fontSize: '0.875rem' }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Avatar & Name */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fade-in">
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: 'white',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!editing ? (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile?.name || user?.name}</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>+91 {profile?.phone || user?.phone}</p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#F59E0B' }}>⭐</span>
                <span style={{ fontWeight: 600 }}>{profile?.rating?.toFixed(1) || '5.0'}</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>({profile?.totalRatings || 0} ratings)</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Trips', value: profile?.vehicles?.length || '0', icon: '🚗' },
            { label: 'Addresses', value: profile?.addresses?.length || '0', icon: '📍' },
            { label: 'Vehicles', value: profile?.vehicles?.length || '0', icon: '🏎️' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', margin: '4px 0' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Saved Addresses */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📍 Saved Addresses</h3>
          {(profile?.addresses?.length || 0) === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No saved addresses yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.addresses.map((addr: any) => (
                <div key={addr._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '8px',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{addr.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{addr.address}</div>
                  </div>
                  <button
                    onClick={() => api.deleteAddress(addr._id).then(loadProfile)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🚗 My Vehicles</h3>
          {(profile?.vehicles?.length || 0) === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No vehicles added yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.vehicles.map((v: any) => (
                <div key={v._id} style={{
                  padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '8px',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.make} {v.model}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {v.transmission} · {v.year || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>

      <nav className="tab-bar">
        <Link to="/" className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/history" className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span>Trips</span>
        </Link>
        <Link to="/profile" className="tab-item active">
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
