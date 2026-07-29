import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';
import { getDriverSocket } from '../lib/socket';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function IconCash() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <rect x="2" y="6" width="18" height="12" rx="2" />
      <circle cx="11" cy="12" r="3" />
      <path d="M6 6V5a1 1 0 011-1h8a1 1 0 011 1v1" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
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
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ width: 14, height: 14 }}>
      <path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
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
    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.2l-3.6 1.8.7-4L2.2 5.2l4-.6z" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <path d="M4 12l2-5h8l2 5" strokeLinecap="round" />
      <rect x="2" y="12" width="16" height="6" rx="2" />
      <circle cx="5.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
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

export default function HomePage() {
  const navigate = useNavigate();
  const { driver, accessToken, setOnline } = useDriverAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    if (accessToken) setupSocket(accessToken);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [accessToken]);

  const loadData = async () => {
    try {
      const [profileData, earningsData]: any[] = await Promise.all([
        driverApi.getProfile(),
        driverApi.getEarnings('today'),
      ]);
      setProfile(profileData);
      setEarnings(earningsData);
    } catch {}
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

  const startCountdown = () => {
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
  };

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
          location = { lat: 19.8762, lng: 75.3433 }; // Chhatrapati Sambhajinagar
        }
      }

      await driverApi.toggleOnline(newStatus, location);
      setProfile((p: any) => ({ ...p, isOnline: newStatus }));
      setOnline(newStatus);
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleAccept = async () => {
    if (!incomingRequest) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const booking: any = await driverApi.acceptBooking(incomingRequest.booking._id);
      setIncomingRequest(null);
      toast.success('Booking accepted!');
      navigate(`/trip/${booking._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Booking no longer available');
      setIncomingRequest(null);
    }
  };

  const handleDecline = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIncomingRequest(null);
  };

  const isOnline = profile?.isOnline || driver?.isOnline;

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
        {/* Welcome */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--sp-5)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Welcome back</p>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800 }}>
            {profile?.name || driver?.name || 'Driver'}
          </h1>
        </div>

        {/* KYC Warning */}
        {profile?.kyc?.status !== 'verified' && (
          <div
            className="kyc-warning animate-fade-in"
            onClick={() => navigate('/kyc')}
            style={{ marginBottom: 'var(--sp-4)' }}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/kyc')}
          >
            <span style={{ color: 'var(--color-warning)' }}>
              <IconAlert />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                Complete KYC Verification
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {profile?.kyc?.status === 'pending'
                  ? 'Your documents are under review'
                  : 'Upload your documents to start driving'}
              </div>
            </div>
            <span style={{ color: 'var(--color-text-muted)' }}>
              <IconArrowRight />
            </span>
          </div>
        )}

        {/* Online Toggle */}
        <div
          className={`online-toggle animate-fade-in ${isOnline ? 'is-online' : 'is-offline'}`}
          style={{ marginBottom: 'var(--sp-4)' }}
        >
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: isOnline ? 'var(--color-online-light)' : 'var(--color-text-primary)',
            }}>
              {isOnline ? 'You&apos;re Online' : 'You&apos;re Offline'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {isOnline ? 'Receiving booking requests' : 'Go online to accept rides'}
            </div>
          </div>
          <button
            className={`toggle-switch ${isOnline ? 'on' : 'off'}`}
            onClick={handleToggleOnline}
            disabled={isTogglingOnline}
            aria-label={isOnline ? 'Go offline' : 'Go online'}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        {/* Today's Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--sp-3)',
          marginBottom: 'var(--sp-4)',
        }}>
          <div className="stat-card">
            <div className="stat-card-label">Today&apos;s Earnings</div>
            <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>
              &#x20B9;{earnings?.totalEarnings || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Trips Today</div>
            <div className="stat-card-value" style={{ color: 'var(--color-primary)' }}>
              {earnings?.tripCount || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Rating</div>
            <div className="stat-card-value" style={{
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <IconStar />
              {profile?.rating?.toFixed(1) || '5.0'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Trips</div>
            <div className="stat-card-value" style={{ color: 'var(--color-text-primary)' }}>
              {profile?.totalTrips || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <button
            className="quick-action"
            onClick={() => navigate('/earnings')}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
              <IconCash />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Earnings History
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                View all past trips &amp; payouts
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
              <IconArrowRight />
            </span>
          </button>

          <button
            className="quick-action"
            onClick={() => navigate('/kyc')}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(129,140,248,0.12)', color: '#818CF8' }}>
              <IconId />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                {profile?.kyc?.status === 'verified' ? 'KYC Documents' : 'Update KYC'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                {profile?.kyc?.status === 'verified' ? 'Verified and approved' : 'Upload required documents'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
              <IconArrowRight />
            </span>
          </button>
        </div>
      </div>

      {/* Incoming Booking Request Modal */}
      {incomingRequest && (
        <div className="booking-request-overlay">
          <div className="booking-request-modal">
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--sp-5)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', marginBottom: 2 }}>New Booking Request</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Accept before the timer runs out
                </p>
              </div>
              {/* Timer ring */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: `3px solid ${timer > 15 ? 'var(--color-primary)' : 'var(--color-warning)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: timer > 15 ? 'var(--color-primary)' : 'var(--color-warning)',
                flexShrink: 0,
                transition: 'border-color var(--transition-normal), color var(--transition-normal)',
              }}>
                {timer}
              </div>
            </div>

            {/* Route */}
            <div style={{
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--sp-4) var(--sp-5)',
              marginBottom: 'var(--sp-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-3)',
            }}>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-primary)', marginTop: 2 }}><IconMapPin /></span>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {incomingRequest.booking.pickup?.address || 'Pickup location'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-error)', marginTop: 2 }}><IconFlag /></span>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {incomingRequest.booking.drop?.address || 'Drop location'}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: 'var(--sp-3)',
                background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Distance</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2, fontSize: '0.9rem' }}>
                  {incomingRequest.distanceKm?.toFixed(1) || '—'} km
                </div>
              </div>
              <div style={{
                flex: 1, textAlign: 'center', padding: 'var(--sp-3)',
                background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Fare</div>
                <div style={{ fontWeight: 800, color: 'var(--color-success)', marginTop: 2, fontSize: '0.9rem' }}>
                  &#x20B9;{incomingRequest.booking.fare?.total || '—'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button className="btn btn-decline" style={{ flex: 1, gap: 6 }} onClick={handleDecline}>
                <IconX />
                Decline
              </button>
              <button className="btn btn-accept" style={{ flex: 2, gap: 6 }} onClick={handleAccept}>
                <IconCheck />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="tab-bar">
        <Link to="/" className="tab-item active">
          <IconHome />
          <span>Home</span>
        </Link>
        <Link to="/earnings" className="tab-item">
          <IconCash />
          <span>Earnings</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <IconUser />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
