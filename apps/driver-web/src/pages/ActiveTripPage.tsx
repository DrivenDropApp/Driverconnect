import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';
import { getDriverSocket } from '../lib/socket';

/* ── Icons ───────────────────────────────────────────────────────────────────── */
function IconMapPin() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <circle cx="8" cy="6.5" r="2.5" />
      <path d="M8 1C5 1 2.5 3.4 2.5 6.5c0 4.5 5.5 8.5 5.5 8.5s5.5-4 5.5-8.5C13.5 3.4 11 1 8 1z" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M3 1v14M3 2h10L11 7h2l-2 5H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg viewBox="0 0 16 16" fill="#F59E0B" style={{ width: 13, height: 13 }}>
      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.2l-3.6 1.8.7-4L2.2 5.2l4-.6z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14 }}>
      <path d="M2.5 3.5A1 1 0 013.5 2.5h2l1 3-1.5 1.5A9 9 0 0010.5 10l1.5-1.5 3 1v2a1 1 0 01-1 1C6 13 3 7 2.5 3.5z" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
      <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconNavigation() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 18, height: 18 }}>
      <path d="M10 2L3 18l7-4 7 4L10 2z" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
      <path d="M6 4l12 6-12 6V4z" />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7 12l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Trip status steps config ───────────────────────────────────────────────── */
const STEPS = [
  { id: 'assigned',      label: 'En Route' },
  { id: 'driver_arrived', label: 'Arrived' },
  { id: 'otp_verified',  label: 'OTP OK' },
  { id: 'started',       label: 'Started' },
  { id: 'completed',     label: 'Done' },
];

function getStepIndex(status: string) {
  return STEPS.findIndex(s => s.id === status);
}

/* ── Status Stepper ─────────────────────────────────────────────────────────── */
function StatusStepper({ status }: { status: string }) {
  const activeIdx = getStepIndex(status);
  return (
    <div className="status-stepper">
      {STEPS.map((step, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className="status-step" style={{ flex: '0 0 auto' }}>
              <div className={`status-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {isDone ? <IconCheck /> : i + 1}
              </div>
              <div className={`status-step-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {step.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`status-connector ${isDone ? 'done' : ''}`} style={{ flex: 1, margin: '0 2px', marginTop: '-16px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function ActiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useDriverAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const mapRef = useRef<any>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    loadBooking();
    if (accessToken) setupSocket(accessToken);
    startLocationBroadcast();
    setTimeout(initMap, 300);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [id]);

  const loadBooking = async () => {
    try {
      const data = await driverApi.getBooking(id!) as any;
      setBooking(data);
    } catch {
      toast.error('Failed to load trip');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = (token: string) => {
    const socket = getDriverSocket(token);
    socketRef.current = socket;
    socket.emit('join:trip', { bookingId: id });
  };

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;
    const mapEl = document.getElementById('trip-map');
    if (!mapEl) return;
    const map = L.map(mapEl, { zoomControl: false }).setView([19.8762, 75.3433], 14);
    const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY;
    if (OLA_API_KEY) {
      L.tileLayer(`https://api.olamaps.io/tiles/v1/styles/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_API_KEY}`, {
        attribution: '© Ola Maps', maxZoom: 18,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    }
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
  };

  const startLocationBroadcast = useCallback(() => {
    locationIntervalRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const L = (window as any).L;
          if (L && mapRef.current) {
            if (!(mapRef as any).driverMarker) {
              (mapRef as any).driverMarker = L.marker([lat, lng]).addTo(mapRef.current);
            } else {
              (mapRef as any).driverMarker.setLatLng([lat, lng]);
            }
          }
          if (socketRef.current) {
            socketRef.current.emit('location:update', { bookingId: id, lat, lng });
          }
        },
        () => { },
        { enableHighAccuracy: true, timeout: 3000 },
      );
    }, 2500);
  }, [id]);

  const handleArrive = async () => {
    setActionLoading(true);
    try {
      const updated = await driverApi.arrive(id!) as any;
      setBooking(updated);
      toast.success('Marked as arrived! Ask customer for OTP.');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) { toast.error('Enter the 4-digit OTP'); return; }
    setOtpVerifying(true);
    try {
      const updated = await driverApi.verifyOtp(id!, otp) as any;
      setBooking(updated);
      toast.success('OTP verified! Start the trip.');
    } catch (err: any) { toast.error(err.message || 'Invalid OTP'); }
    finally { setOtpVerifying(false); }
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      const updated = await driverApi.startTrip(id!) as any;
      setBooking(updated);
      toast.success('Trip started! Drive safe.');
    } catch (err: any) { toast.error(err.message || 'Failed to start trip'); }
    finally { setActionLoading(false); }
  };

  const handleCompleteTrip = async () => {
    if (!window.confirm('Complete this trip?')) return;
    setActionLoading(true);
    try {
      const updated = await driverApi.completeTrip(id!) as any;
      setBooking(updated);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      toast.success('Trip completed! Great job!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) { toast.error(err.message || 'Failed to complete trip'); }
    finally { setActionLoading(false); }
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading trip...</p>
      </div>
    );
  }

  if (!booking) return null;

  const customer = typeof booking.customerId === 'object' ? booking.customerId : null;
  const statusDisplay = booking.status.replace(/_/g, ' ');

  return (
    <div className="page">
      {/* Map */}
      <div id="trip-map" style={{ height: '40vh', width: '100%', flexShrink: 0 }} />

      {/* Bottom Panel */}
      <div style={{ flex: 1, padding: '1.25rem 1.25rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Live Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="live-badge" style={{ marginBottom: 6, display: 'inline-flex' }}>Live Trip</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em', marginTop: 4 }}>
              Active Trip
            </h2>
          </div>
          <div style={{
            padding: '5px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.7rem', fontWeight: 700,
            background: 'var(--color-live-subtle)',
            color: 'var(--color-live-light)',
            border: '1px solid rgba(99,102,241,0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {statusDisplay}
          </div>
        </div>

        {/* ── Status Stepper ── */}
        <div className="card" style={{ padding: '1rem' }}>
          <StatusStepper status={booking.status} />
        </div>

        {/* ── Customer Info ── */}
        {customer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.1rem',
            background: 'var(--color-glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-glass-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D9488, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: '0 0 16px rgba(13,148,136,0.3)',
            }}>
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                {customer.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <IconStar /> {customer.rating?.toFixed(1) || '5.0'}
                </span>
                <span style={{ color: 'var(--color-border-strong)', fontSize: '0.7rem' }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <IconPhone /> {customer.phone}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Route Card ── */}
        <div className="card" style={{ padding: '1rem 1.1rem' }}>
          {/* Pickup */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ paddingTop: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary-glow)', flexShrink: 0 }} />
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '3px 0' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pickup</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: 1 }}>{booking.pickup?.address}</div>
            </div>
          </div>
          {/* Drop */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ paddingTop: 3, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--color-error)', transform: 'rotate(45deg)', boxShadow: '0 0 8px rgba(239,68,68,0.35)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Drop</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginTop: 1 }}>{booking.drop?.address}</div>
            </div>
          </div>
        </div>

        {/* ── Fare / Distance Chips ── */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.63rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Distance</div>
            <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 4, fontSize: '1rem' }}>
              {booking.distance || '—'} km
            </div>
          </div>
          <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '0.63rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fare</div>
            <div style={{ fontWeight: 800, color: 'var(--color-success)', marginTop: 4, fontSize: '1rem' }}>
              ₹{booking.fare?.total || '—'}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {booking.status === 'assigned' && (
          <button className="btn btn-primary btn-full btn-lg" onClick={handleArrive} disabled={actionLoading}
            style={{ gap: 8 }}>
            {actionLoading
              ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Updating...</>
              : <><IconNavigation /> I Have Arrived</>}
          </button>
        )}

        {booking.status === 'driver_arrived' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Ask the customer for their OTP to start the trip
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="input"
                placeholder="4-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ flex: 1, textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.18em', height: '3rem' }}
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleVerifyOtp} disabled={otpVerifying || otp.length < 4}
                style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', flexShrink: 0, padding: 0 }}>
                {otpVerifying
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <IconCheck />}
              </button>
            </div>
          </div>
        )}

        {booking.status === 'otp_verified' && (
          <button className="btn btn-online btn-full btn-lg" onClick={handleStartTrip} disabled={actionLoading}
            style={{ gap: 8 }}>
            {actionLoading
              ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Starting...</>
              : <><IconPlay /> Start Trip</>}
          </button>
        )}

        {booking.status === 'started' && (
          <button className="btn btn-accept btn-full btn-lg" onClick={handleCompleteTrip} disabled={actionLoading}
            style={{ gap: 8 }}>
            {actionLoading
              ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Completing...</>
              : <><IconCheckCircle /> Complete Trip</>}
          </button>
        )}

        {booking.status === 'completed' && (
          <div style={{
            textAlign: 'center', padding: '1.5rem',
            background: 'rgba(16,185,129,0.08)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 0 32px rgba(16,185,129,0.1)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '1.1rem' }}>
              Trip Completed!
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              ₹{booking.fare?.total} earned · Returning home...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
