import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

/* ── SVG Icons ─────────────────────────────────────────────────────── */
function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z"
        fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}
function IconList({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <rect x="3" y="5" width="16" height="2.5" rx="1.25" fill={active ? 'currentColor' : 'none'} />
      <rect x="3" y="10.5" width="16" height="2.5" rx="1.25" />
      <rect x="3" y="16" width="10" height="2.5" rx="1.25" />
    </svg>
  );
}
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <circle cx="11" cy="7" r="4" fill={active ? 'currentColor' : 'none'} />
      <path d="M2 20c0-4.5 4-7 9-7s9 2.5 9 7" strokeLinecap="round" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 16, height: 16, flexShrink: 0 }}>
      <circle cx="8" cy="6.5" r="2.5" />
      <path d="M8 1C5 1 2.5 3.5 2.5 6.5c0 4 5.5 8.5 5.5 8.5s5.5-4.5 5.5-8.5C13.5 3.5 11 1 8 1z" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 14, height: 14 }}>
      <path d="M2 7h10M8 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Trip type icons ───────────────────────────────────────────────── */
function IconCity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 22, height: 22 }}>
      <rect x="2" y="7" width="6" height="15" />
      <rect x="8" y="3" width="8" height="19" />
      <rect x="16" y="10" width="6" height="12" />
      <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
  );
}
function IconRoad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 22, height: 22 }}>
      <path d="M5 22L10 2M19 22L14 2M10 12h4" strokeLinecap="round" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 22, height: 22 }}>
      <path d="M21 2v6h-6M3 12a9 9 0 0115.8-5.8L21 8M3 22v-6h6M21 12a9 9 0 01-15.8 5.8L3 16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TRIP_TYPES = [
  { type: 'local',      icon: <IconCity />,    name: 'Local',      desc: 'Within city',     color: '#0D9488' },
  { type: 'outstation', icon: <IconRoad />,    name: 'Outstation', desc: 'Between cities',  color: '#7C3AED' },
  { type: 'hourly',     icon: <IconClock />,   name: 'Hourly',     desc: 'By the hour',     color: '#F59E0B' },
  { type: 'roundtrip',  icon: <IconRefresh />, name: 'Round Trip', desc: 'There and back',  color: '#EF4444' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadActiveBooking(); }, []);

  // Request location permission on home screen load (so it's ready when booking)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // granted — no action needed
        () => {}, // denied — silently ignore; user will be prompted again in booking
        { timeout: 5000, maximumAge: 60000 }
      );
    }
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
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeTripLabel = () => {
    if (!activeBooking) return '';
    const map: Record<string, string> = {
      searching: 'Finding your driver...',
      assigned:  'Driver is on the way',
      started:   'Trip in progress',
    };
    return map[activeBooking.status] || 'Trip active';
  };

  return (
    <div className="page" style={{ paddingBottom: 76 }}>
      {/* Navbar */}
      <nav className="navbar home-reveal home-reveal-1">
        <span className="navbar-logo">Driver<span>Connect</span></span>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: 'white',
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      </nav>

      <div style={{ padding: '1.5rem' }} className="home-content">
        {/* Greeting */}
        <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>
            {getGreeting()},
          </p>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {user?.name || 'there'}
          </h1>
        </div>

        {/* Active Booking Banner */}
        {!loading && activeBooking && (
          <div
            className="active-booking-banner animate-fade-in"
            onClick={() => navigate(`/booking/live/${activeBooking._id}`)}
            style={{ marginBottom: '1.5rem' }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(13,148,136,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconMapPin />
            </div>
            <div style={{ flex: 1 }}>
              <span className="badge badge-live" style={{ marginBottom: 4 }}>Live Trip</span>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                {activeTripLabel()}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Tap to track</p>
            </div>
            <IconArrowRight />
          </div>
        )}

        {/* Trip Types */}
        <div style={{ marginBottom: '2rem' }} className="home-reveal home-reveal-2">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem', letterSpacing: '-0.01em' }}>
            What do you need?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {TRIP_TYPES.map(({ type, icon, name, desc, color }) => (
              <button
                key={type}
                className="trip-type-card"
                onClick={() => navigate(`/booking/new?type=${type}`)}
              >
                <div
                  className="trip-type-icon-wrap"
                  style={{ color }}
                >
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="trip-type-name">{name}</div>
                  <div className="trip-type-desc">{desc}</div>
                </div>
                <div style={{ color: 'var(--color-text-disabled)' }}>
                  <IconArrowRight />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }} className="home-reveal home-reveal-3">
          {[
            { label: 'Verified Drivers', value: '12+' },
            { label: 'Avg Rating',       value: '4.8' },
            { label: 'Avg Pickup',       value: '8 min' },
          ].map(({ label, value }) => (
            <div key={label} className="stat-mini">
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <Link to="/" className="tab-item active">
          <IconHome active />
          <span>Home</span>
        </Link>
        <Link to="/history" className="tab-item">
          <IconList />
          <span>Trips</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <IconUser />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
