import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';

/* ── Icons ───────────────────────────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
    </svg>
  );
}
function IconCash() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="2" y="6" width="18" height="12" rx="2" />
      <circle cx="11" cy="12" r="3" />
      <path d="M6 6V5a1 1 0 011-1h8a1 1 0 011 1v1" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 22, height: 22 }}>
      <circle cx="11" cy="7" r="4" />
      <path d="M2 20c0-4.5 4-7 9-7s9 2.5 9 7" strokeLinecap="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 16 16" fill="#F59E0B" style={{ width: 16, height: 16 }}>
      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.2l-3.6 1.8.7-4L2.2 5.2l4-.6z" />
    </svg>
  );
}
function IconRoute() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 20, height: 20 }}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M5 7v3a4 4 0 004 4h2" strokeLinecap="round" />
    </svg>
  );
}
function IconTool() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 20, height: 20 }}>
      <path d="M14.5 2.5a4 4 0 00-4 4c0 .4.05.78.14 1.14L3.5 15a1.5 1.5 0 002.12 2.12l7.36-7.14c.36.1.74.15 1.14.15a4 4 0 100-7.63z" strokeLinecap="round" />
    </svg>
  );
}
function IconId() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}>
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <circle cx="7" cy="11" r="2" />
      <path d="M11 9h4M11 12h3" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 18, height: 18 }}>
      <path d="M13 10H3M7 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4h7a1 1 0 011 1v10a1 1 0 01-1 1H9" strokeLinecap="round" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 18, height: 18 }}>
      <path d="M13.5 3.5l3 3-9 9H4.5v-3l9-9z" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Dashboard Stat Card ─────────────────────────────────────────────────────── */
function DashCard({ icon, value, label, color }: { icon: React.ReactNode; value: React.ReactNode; label: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color, fontSize: '1.4rem' }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { driver, clearAuth, updateDriver } = useDriverAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    driverApi.getProfile()
      .then((p: any) => { setProfile(p); setName(p.name || ''); })
      .catch(() => { });
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
    try { await driverApi.logout(); } catch { }
    clearAuth();
    navigate('/login');
  };

  const kycStatus = profile?.kyc?.status;
  const kycBadgeClass = kycStatus === 'verified' ? 'badge-verified' : kycStatus === 'rejected' ? 'badge-rejected' : 'badge-pending';
  const kycLabel = kycStatus === 'verified' ? 'KYC Verified' : kycStatus === 'rejected' ? 'KYC Rejected' : 'KYC Pending';

  const avatarSeed = encodeURIComponent(profile?.name || driver?.name || 'D');
  const avatarUrl = profile?.kyc?.photoUrl
    || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=0d9488&textColor=ffffff`;

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Navbar */}
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem 0.5rem', gap: 4, fontSize: '0.9rem' }}>
          ← Back
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>My Profile</span>
        <button className="btn btn-ghost" onClick={() => setEditing(!editing)}
          style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', color: editing ? 'var(--color-error)' : 'var(--color-primary-light)' }}>
          {editing ? 'Cancel' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconEdit /> Edit
            </span>
          )}
        </button>
      </nav>

      <div style={{ padding: '1.5rem 1.25rem' }}>

        {/* ── Avatar Hero ── */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          {/* Gradient ring */}
          <div style={{
            display: 'inline-block',
            padding: 3,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #14B8A6, #059669, #6366F1, #14B8A6)',
            boxShadow: '0 0 28px rgba(13,148,136,0.35)',
            marginBottom: '1rem',
          }}>
            <div style={{ padding: 3, borderRadius: '50%', background: 'var(--color-bg)' }}>
              <img
                src={avatarUrl}
                alt="Profile"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=0d9488&textColor=ffffff`;
                }}
              />
            </div>
          </div>

          {!editing ? (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {profile?.name}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.6rem' }}>
                +91 {profile?.phone}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: '0.6rem' }}>
                <IconStar />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile?.rating?.toFixed(1) || '5.0'}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  ({profile?.totalRatings || 0} ratings)
                </span>
              </div>
              <span className={`badge ${kycBadgeClass}`}>{kycLabel}</span>
            </>
          ) : (
            <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Display Name
                </label>
                <input className="input" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" autoFocus />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}
                style={{ height: '2.75rem' }}>
                {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── Dashboard Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <DashCard
            icon={<IconRoute />}
            value={profile?.totalTrips || 0}
            label="Total Trips"
            color="var(--color-primary-light)"
          />
          <DashCard
            icon={<IconStar />}
            value={profile?.rating?.toFixed(1) || '5.0'}
            label="Rating"
            color="var(--color-warning)"
          />
          <DashCard
            icon={<IconTool />}
            value={profile?.vehicleSkills?.length || 0}
            label="Skills"
            color="#818CF8"
          />
        </div>

        {/* ── KYC Action ── */}
        <button className="quick-action animate-fade-in" onClick={() => navigate('/kyc')}
          style={{ marginBottom: '0.75rem' }}>
          <div className="quick-action-icon" style={{ background: 'rgba(129,140,248,0.12)', color: '#818CF8' }}>
            <IconId />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              {kycStatus === 'verified' ? 'KYC Documents' : 'Update KYC'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
              {kycStatus === 'verified' ? 'Verified & approved' : 'Upload required documents'}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}><IconArrowRight /></span>
        </button>

        {/* ── Sign Out (de-emphasized) ── */}
        <button
          className="btn btn-danger btn-full"
          onClick={handleLogout}
          style={{ gap: 8, fontWeight: 600, height: '2.75rem', marginTop: 4 }}
        >
          <IconLogOut />
          Sign Out
        </button>
      </div>

      {/* Tab Bar */}
      <nav className="tab-bar">
        <button onClick={() => navigate('/')} className="tab-item">
          <span className="tab-icon"><IconHome /></span>
          <span>Home</span>
        </button>
        <button onClick={() => navigate('/earnings')} className="tab-item">
          <span className="tab-icon"><IconCash /></span>
          <span>Earnings</span>
        </button>
        <button onClick={() => navigate('/profile')} className="tab-item active">
          <span className="tab-icon"><IconUser /></span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
