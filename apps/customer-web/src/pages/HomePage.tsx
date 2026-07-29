import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveBooking();
  }, []);

  const loadActiveBooking = async () => {
    try {
      const res: any = await api.getActiveBooking();
      setActiveBooking(res.booking);
    } catch {
      // no active booking
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const TRIP_TYPES = [
    { type: 'local', icon: '🏙️', name: 'Local', desc: 'Within city', color: '#0D9488' },
    { type: 'outstation', icon: '🛣️', name: 'Outstation', desc: 'Between cities', color: '#7C3AED' },
    { type: 'hourly', icon: '⏱️', name: 'Hourly', desc: 'By the hour', color: '#F59E0B' },
    { type: 'roundtrip', icon: '🔄', name: 'Round Trip', desc: 'There and back', color: '#EF4444' },
  ];

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">DriverConnect</span>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: 'white',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Greeting */}
        <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>{getGreeting()},</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {user?.name || 'there'} 👋
          </h1>
        </div>

        {/* Active booking banner */}
        {activeBooking && (
          <div
            className="animate-fade-in"
            onClick={() => navigate(`/booking/live/${activeBooking._id}`)}
            style={{
              background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(15,118,110,0.1))',
              border: '1px solid rgba(13,148,136,0.3)',
              borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
            }}
          >
            <div style={{ fontSize: '2rem' }}>🚗</div>
            <div style={{ flex: 1 }}>
              <div className="badge badge-live" style={{ marginBottom: '4px' }}>Live Trip</div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F1F5F9' }}>
                {activeBooking.status === 'searching' ? 'Finding your driver...' :
                 activeBooking.status === 'assigned' ? 'Driver on the way!' :
                 activeBooking.status === 'started' ? 'Trip in progress' : 'Trip active'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Tap to track →</p>
            </div>
            <div style={{ fontSize: '1.5rem' }}>→</div>
          </div>
        )}

        {/* Trip Type Grid */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            What do you need?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {TRIP_TYPES.map(({ type, icon, name, desc, color }) => (
              <button
                key={type}
                onClick={() => navigate(`/booking/new?type=${type}`)}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px', padding: '1.25rem',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                  (e.currentTarget as HTMLButtonElement).style.background = `${color}10`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9' }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { icon: '✅', label: 'Verified Drivers', value: '12+' },
            { icon: '⭐', label: 'Avg Rating', value: '4.8' },
            { icon: '⚡', label: 'Avg Pickup', value: '8 min' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '12px', padding: '1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginTop: '4px' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <Link to="/" className="tab-item active">
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/history" className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span>Trips</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
