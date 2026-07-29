import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';
import { getDriverSocket } from '../lib/socket';

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
      // Play notification sound if possible
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

      // Get current location if going online
      let location;
      if (newStatus && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
          );
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          location = { lat: 18.5204, lng: 73.8567 }; // Default to Pune
        }
      }

      await driverApi.toggleOnline(newStatus, location);
      setProfile((p: any) => ({ ...p, isOnline: newStatus }));
      setOnline(newStatus);
      toast.success(newStatus ? '🟢 You are now online!' : '⚫ You are now offline');
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
      toast.success('Booking accepted! 🎉');
      navigate(`/trip/${booking._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Booking no longer available');
      setIncomingRequest(null);
    }
  };

  const handleDecline = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIncomingRequest(null);
    toast('Request declined', { icon: '👋' });
  };

  const isOnline = profile?.isOnline || driver?.isOnline;

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">Driver Portal</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${isOnline ? 'badge-verified' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
            {isOnline ? '● ONLINE' : '○ OFFLINE'}
          </span>
        </div>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Welcome */}
        <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Welcome back,</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{profile?.name || driver?.name} 🚗</h1>
        </div>

        {/* KYC Warning */}
        {profile?.kyc?.status !== 'verified' && (
          <div onClick={() => navigate('/kyc')} style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#F59E0B' }}>Complete KYC Verification</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                {profile?.kyc?.status === 'pending' ? 'Your documents are under review' : 'Upload your documents to start driving'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#94A3B8' }}>→</span>
          </div>
        )}

        {/* Online Toggle */}
        <div className={`online-toggle ${isOnline ? 'is-online' : 'is-offline'} animate-fade-in`} style={{ marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#F1F5F9' }}>
              {isOnline ? '🟢 You\'re Online' : '⚫ You\'re Offline'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
              {isOnline ? 'Receiving booking requests' : 'Go online to accept rides'}
            </div>
          </div>
          <button
            className={`toggle-switch ${isOnline ? 'on' : 'off'}`}
            onClick={handleToggleOnline}
            disabled={isTogglingOnline}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        {/* Today's Earnings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.25rem' }}>TODAY'S EARNINGS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
              ₹{earnings?.totalEarnings || 0}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.25rem' }}>TRIPS TODAY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D9488' }}>
              {earnings?.tripCount || 0}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.25rem' }}>RATING</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>
              ⭐ {profile?.rating?.toFixed(1) || '5.0'}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.25rem' }}>TOTAL TRIPS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818CF8' }}>
              {profile?.totalTrips || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-full" onClick={() => navigate('/earnings')} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
            💰 View Earnings History
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => navigate('/kyc')} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
            📄 {profile?.kyc?.status === 'verified' ? 'View KYC Documents' : 'Update KYC'}
          </button>
        </div>
      </div>

      {/* Incoming Booking Request Modal */}
      {incomingRequest && (
        <div className="booking-request-overlay">
          <div className="booking-request-modal">
            {/* Timer ring */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>New Booking Request!</h2>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', border: `3px solid ${timer > 15 ? '#0D9488' : '#F59E0B'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.1rem', color: timer > 15 ? '#0D9488' : '#F59E0B',
              }}>
                {timer}
              </div>
            </div>

            {/* Trip Details */}
            <div style={{ background: 'var(--color-surface-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ color: '#0D9488', marginTop: '2px' }}>📍</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>FROM</div>
                  <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{incomingRequest.booking.pickup?.address || 'Pickup location'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#EF4444', marginTop: '2px' }}>🏁</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>TO</div>
                  <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{incomingRequest.booking.drop?.address || 'Drop location'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>DISTANCE</div>
                <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{incomingRequest.distanceKm?.toFixed(1) || '—'} km away</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>FARE</div>
                <div style={{ fontWeight: 700, color: '#10B981' }}>₹{incomingRequest.booking.fare?.total || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-decline" style={{ flex: 1 }} onClick={handleDecline}>
                ✕ Decline
              </button>
              <button className="btn btn-accept" style={{ flex: 2 }} onClick={handleAccept}>
                ✓ Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="tab-bar">
        <button onClick={() => navigate('/')} className="tab-item active">
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span>Home</span>
        </button>
        <button onClick={() => navigate('/earnings')} className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>💰</span>
          <span>Earnings</span>
        </button>
        <button onClick={() => navigate('/profile')} className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
