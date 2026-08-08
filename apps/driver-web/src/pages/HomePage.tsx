import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';
import { getDriverSocket } from '../lib/socket';

/* ── Icon Components ─────────────────────────────────────────────────────────── */
function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'}
      style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
    </svg>
  );
}
function IconCash({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'}
      style={{ width: 22, height: 22 }}>
      <rect x="2" y="6" width="18" height="12" rx="2" />
      <circle cx="11" cy="12" r="3" />
      <path d="M6 6V5a1 1 0 011-1h8a1 1 0 011 1v1" />
    </svg>
  );
}
function IconUser({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'}
      style={{ width: 22, height: 22 }}>
      <circle cx="11" cy="7" r="4" />
      <path d="M2 20c0-4.5 4-7 9-7s9 2.5 9 7" strokeLinecap="round" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
      style={{ width: 20, height: 20, flexShrink: 0 }}>
      <path d="M10 2L2 17h16L10 2z" strokeLinejoin="round" />
      <path d="M10 8v4M10 14.5v.5" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 14, height: 14, flexShrink: 0 }}>
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1C4.5 1 2.5 3 2.5 5.5c0 3.5 4.5 7.5 4.5 7.5s4.5-4 4.5-7.5C11.5 3 9.5 1 7 1z" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 14, height: 14, flexShrink: 0 }}>
      <path d="M3 1v12M3 2h8L9 6h2l-2 4H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ width: 16, height: 16 }}>
      <path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'draw-check 0.35s ease both' }} />
    </svg>
  );
}
function IconX() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ width: 14, height: 14 }}>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 16 16" fill="#F59E0B" style={{ width: 15, height: 15 }}>
      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.2l-3.6 1.8.7-4L2.2 5.2l4-.6z" />
    </svg>
  );
}
function IconId() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <circle cx="7" cy="11" r="2" />
      <path d="M11 9h4M11 12h3" strokeLinecap="round" />
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 20, height: 20 }}>
      <path d="M3 14l4-5 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconRoute() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 20, height: 20 }}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M5 7v3a4 4 0 004 4h2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Animated Count-Up Hook ─────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let raf: number;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(raf); startRef.current = null; };
  }, [target, duration]);
  return value;
}

/* ── Stat Card with Count-Up ────────────────────────────────────────────────── */
function StatCard({ label, rawValue, prefix = '', suffix = '', icon, color, delay = 0 }: {
  label: string; rawValue: number; prefix?: string; suffix?: string;
  icon: React.ReactNode; color: string; delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const animated = useCountUp(visible ? rawValue : 0, 900);
  const display = typeof rawValue === 'number' && rawValue % 1 !== 0
    ? rawValue.toFixed(1)
    : animated;

  return (
    <div className="stat-card" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}>
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color }}>
        {prefix}{rawValue % 1 !== 0 ? rawValue.toFixed(1) : animated}{suffix}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

/* ── SVG Countdown Ring ─────────────────────────────────────────────────────── */
function CountdownRing({ timer, max = 30 }: { timer: number; max?: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const progress = timer / max;
  const offset = circ * (1 - progress);
  const color = timer > 15 ? '#14B8A6' : timer > 8 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" className="countdown-ring">
        <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <circle cx="28" cy="28" r={r} stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1rem', color,
        transition: 'color 0.3s ease',
      }}>
        {timer}
      </div>
    </div>
  );
}

/* ── Greeting Helper ─────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { driver, accessToken, setOnline } = useDriverAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    if (accessToken) setupSocket(accessToken);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [accessToken]);

  const loadData = async () => {
    try {
      const [profileData, earningsData]: any[] = await Promise.all([
        driverApi.getProfile(),
        driverApi.getEarnings('today'),
      ]);
      setProfile(profileData);
      setEarnings(earningsData);
    } catch { }
  };

  const setupSocket = (token: string) => {
    const socket = getDriverSocket(token);
    socketRef.current = socket;
    socket.on('booking:request', (data: any) => {
      setIncomingRequest(data);
      setTimer(30);
      startCountdown();
    });
    socket.on('trip:sync', (data: any) => {
      if (data.booking) navigate(`/trip/${data.booking._id}`);
    });
  };

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIncomingRequest(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleToggleOnline = async () => {
    if (!profile) return;
    if (!profile.kyc || profile.kyc.status !== 'verified') {
      toast.error('Complete KYC verification to go online');
      navigate('/kyc');
      return;
    }
    setIsTogglingOnline(true);
    try {
      const newStatus = !profile.isOnline;
      let location;
      if (newStatus && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
          );
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          location = { lat: 19.8762, lng: 75.3433 };
        }
      }
      await driverApi.toggleOnline(newStatus, location);
      setProfile((p: any) => ({ ...p, isOnline: newStatus }));
      setOnline(newStatus);
      toast.success(newStatus ? '🟢 You are now online!' : 'You are now offline');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleAccept = async () => {
    if (!incomingRequest || accepting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setAccepting(true);
    try {
      const booking: any = await driverApi.acceptBooking(incomingRequest.booking._id);
      setIncomingRequest(null);
      toast.success('Booking accepted!');
      navigate(`/trip/${booking._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Booking no longer available');
      setIncomingRequest(null);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIncomingRequest(null);
  };

  const isOnline = profile?.isOnline ?? driver?.isOnline ?? false;
  const firstName = (profile?.name || driver?.name || 'Driver').split(' ')[0];

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">Driver<span>Connect</span></span>
        <span className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </nav>

      <div style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>

        {/* ── Hero Greeting ── */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--sp-5)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 500 }}>
            {getGreeting()} 👋
          </p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 7vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <span className="gradient-text">{firstName}</span>
          </h1>
          {earnings && (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              You've earned{' '}
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                ₹{earnings.totalEarnings || 0}
              </span>{' '}
              today · {earnings.tripCount || 0} trip{earnings.tripCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* ── KYC Warning ── */}
        {profile?.kyc?.status !== 'verified' && (
          <div
            className="kyc-warning animate-fade-in"
            onClick={() => navigate('/kyc')}
            style={{ marginBottom: 'var(--sp-4)' }}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/kyc')}
          >
            <span style={{ color: 'var(--color-warning)' }}><IconAlert /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                {profile?.kyc?.status === 'pending' ? 'KYC Under Review' : 'Complete KYC Verification'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {profile?.kyc?.status === 'pending'
                  ? 'Your documents are being reviewed'
                  : 'Upload your documents to start driving'}
              </div>
            </div>
            <span style={{ color: 'var(--color-text-muted)' }}><IconArrowRight /></span>
          </div>
        )}

        {/* ── Online Toggle ── */}
        <div
          className={`online-toggle animate-fade-in ${isOnline ? 'is-online' : 'is-offline'}`}
          style={{ marginBottom: 'var(--sp-4)' }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em',
              color: isOnline ? 'var(--color-online-light)' : 'var(--color-text-primary)',
              transition: 'color var(--t-normal)',
            }}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {isOnline ? 'Receiving booking requests' : 'Tap to go online and earn'}
            </div>
          </div>
          <button
            className={`toggle-switch ${isOnline ? 'on' : 'off'}`}
            onClick={handleToggleOnline}
            disabled={isTogglingOnline}
            aria-label={isOnline ? 'Go offline' : 'Go online'}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)',
        }}>
          <StatCard
            label="Today's Earnings"
            rawValue={earnings?.totalEarnings || 0}
            prefix="₹"
            icon={<IconTrendUp />}
            color="var(--color-success)"
            delay={50}
          />
          <StatCard
            label="Trips Today"
            rawValue={earnings?.tripCount || 0}
            icon={<IconRoute />}
            color="var(--color-primary-light)"
            delay={120}
          />
          <StatCard
            label="Rating"
            rawValue={parseFloat(profile?.rating?.toFixed(1) || '5.0')}
            suffix=""
            icon={<IconStar />}
            color="var(--color-warning)"
            delay={190}
          />
          <StatCard
            label="Total Trips"
            rawValue={profile?.totalTrips || 0}
            icon={<IconRoute />}
            color="var(--color-text-secondary)"
            delay={260}
          />
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <button className="quick-action animate-fade-in" onClick={() => navigate('/earnings')}
            style={{ animationDelay: '80ms' }}>
            <div className="quick-action-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
              <IconCash />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Earnings History
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                View all past trips & payouts
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}><IconArrowRight /></span>
          </button>

          <button className="quick-action animate-fade-in" onClick={() => navigate('/kyc')}
            style={{ animationDelay: '130ms' }}>
            <div className="quick-action-icon" style={{ background: 'rgba(129,140,248,0.12)', color: '#818CF8' }}>
              <IconId />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                {profile?.kyc?.status === 'verified' ? 'KYC Documents' : 'Update KYC'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                {profile?.kyc?.status === 'verified' ? 'Verified and approved ✓' : 'Upload required documents'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}><IconArrowRight /></span>
          </button>
        </div>
      </div>

      {/* ── Incoming Booking Request Modal ── */}
      {incomingRequest && (
        <div className="booking-request-overlay">
          <div className="booking-request-modal">
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '-8px auto 20px', flexShrink: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-5)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="live-badge">New Request</span>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Incoming Booking</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Accept before time runs out
                </p>
              </div>
              <CountdownRing timer={timer} max={30} />
            </div>

            {/* Route */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--sp-4) var(--sp-5)',
              marginBottom: 'var(--sp-4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* Pickup */}
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid var(--color-primary-light)', boxShadow: '0 0 8px var(--color-primary-glow)' }} />
                  <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '3px 0' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pickup</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: 1 }}>
                    {incomingRequest.booking.pickup?.address || 'Pickup location'}
                  </div>
                </div>
              </div>
              {/* Drop */}
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 2, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--color-error)', boxShadow: '0 0 8px rgba(239,68,68,0.4)', transform: 'rotate(45deg)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Drop</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: 1 }}>
                    {incomingRequest.booking.drop?.address || 'Drop location'}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta chips */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: 'var(--sp-3)',
                background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distance</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 3, fontSize: '0.95rem' }}>
                  {incomingRequest.distanceKm?.toFixed(1) || '—'} km
                </div>
              </div>
              <div style={{
                flex: 1, textAlign: 'center', padding: 'var(--sp-3)',
                background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fare</div>
                <div style={{ fontWeight: 800, color: 'var(--color-success)', marginTop: 3, fontSize: '1.05rem' }}>
                  ₹{incomingRequest.booking.fare?.total || '—'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button className="btn btn-decline" style={{ flex: 1, gap: 6 }} onClick={handleDecline}>
                <IconX /> Decline
              </button>
              <button className="btn btn-accept" style={{ flex: 2, gap: 6 }} onClick={handleAccept} disabled={accepting}>
                {accepting ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <IconCheck />}
                {accepting ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <nav className="tab-bar">
        <Link to="/" className="tab-item active">
          <span className="tab-icon"><IconHome active /></span>
          <span>Home</span>
        </Link>
        <Link to="/earnings" className="tab-item">
          <span className="tab-icon"><IconCash /></span>
          <span>Earnings</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <span className="tab-icon"><IconUser /></span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
