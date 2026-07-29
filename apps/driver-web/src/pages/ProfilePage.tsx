import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { driver, clearAuth, updateDriver } = useDriverAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    driverApi.getProfile().then((p: any) => { setProfile(p); setName(p.name || ''); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await driverApi.updateProfile({ name });
      setProfile((p: any) => ({ ...p, name }));
      updateDriver({ name });
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try { await driverApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem' }}>← Back</button>
        <span style={{ fontWeight: 700 }}>My Profile</span>
        <button className="btn btn-ghost" onClick={() => setEditing(!editing)} style={{ fontSize: '0.875rem' }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={profile?.kyc?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`}
            alt="Profile"
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #059669', marginBottom: '1rem' }}
            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'D'}`; }}
          />
          {!editing ? (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile?.name}</h2>
              <p style={{ color: '#94A3B8' }}>+91 {profile?.phone}</p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#F59E0B' }}>⭐</span>
                <span style={{ fontWeight: 600 }}>{profile?.rating?.toFixed(1) || '5.0'}</span>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>({profile?.totalRatings || 0} ratings)</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge ${profile?.kyc?.status === 'verified' ? 'badge-verified' : profile?.kyc?.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                  {profile?.kyc?.status === 'verified' ? '✓ KYC Verified' : profile?.kyc?.status === 'rejected' ? '✕ KYC Rejected' : '⏳ KYC Pending'}
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Trips', value: profile?.totalTrips || 0, icon: '🚗' },
            { label: 'Rating', value: profile?.rating?.toFixed(1) || '5.0', icon: '⭐' },
            { label: 'Skills', value: profile?.vehicleSkills?.length || 0, icon: '🔧' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', margin: '4px 0' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{label}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary btn-full" onClick={() => navigate('/kyc')} style={{ marginBottom: '0.75rem' }}>
          📄 KYC Documents
        </button>
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>

      <nav className="tab-bar">
        <button onClick={() => navigate('/')} className="tab-item"><span style={{ fontSize: '1.25rem' }}>🏠</span><span>Home</span></button>
        <button onClick={() => navigate('/earnings')} className="tab-item"><span style={{ fontSize: '1.25rem' }}>💰</span><span>Earnings</span></button>
        <button onClick={() => navigate('/profile')} className="tab-item active"><span style={{ fontSize: '1.25rem' }}>👤</span><span>Profile</span></button>
      </nav>
    </div>
  );
}
