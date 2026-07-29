import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';
import { getDriverSocket } from '../lib/socket';

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

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
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

    const map = L.map(mapEl, { zoomControl: false }).setView([19.8762, 75.3433], 14); // Chhatrapati Sambhajinagar
    
    const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY;
    if (OLA_API_KEY) {
      L.tileLayer(`https://api.olamaps.io/tiles/v1/styles/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_API_KEY}`, {
        attribution: '© Ola Maps',
        maxZoom: 18,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    }
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
  };

  // Broadcast location every 2.5s to the trip room
  const startLocationBroadcast = () => {
    locationIntervalRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;

          // Update marker on own map
          const L = (window as any).L;
          if (L && mapRef.current) {
            if (!(mapRef as any).driverMarker) {
              (mapRef as any).driverMarker = L.marker([lat, lng]).addTo(mapRef.current);
            } else {
              (mapRef as any).driverMarker.setLatLng([lat, lng]);
            }
          }

          // Emit to socket (not persisted per tick)
          if (socketRef.current) {
            socketRef.current.emit('location:update', { bookingId: id, lat, lng });
          }

          // DB checkpoint every ~30s (handled by counting intervals: 30/2.5 = 12)
          // Simplified: update every 12 ticks = ~30s
        },
        () => {},
        { enableHighAccuracy: true, timeout: 3000 },
      );
    }, 2500);
  };

  const handleArrive = async () => {
    setActionLoading(true);
    try {
      const updated = await driverApi.arrive(id!) as any;
      setBooking(updated);
      toast.success('Marked as arrived! Ask customer for OTP.');
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) { toast.error('Enter the 4-digit OTP'); return; }
    setOtpVerifying(true);
    try {
      const updated = await driverApi.verifyOtp(id!, otp) as any;
      setBooking(updated);
      toast.success('OTP verified! Start the trip.');
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      const updated = await driverApi.startTrip(id!) as any;
      setBooking(updated);
      toast.success('Trip started! Drive safe 🚗');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!window.confirm('Complete this trip?')) return;
    setActionLoading(true);
    try {
      const updated = await driverApi.completeTrip(id!) as any;
      setBooking(updated);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      toast.success('Trip completed! Great job! 🎉');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ color: '#94A3B8' }}>Loading trip...</p>
      </div>
    );
  }

  if (!booking) return null;

  const customer = typeof booking.customerId === 'object' ? booking.customerId : null;

  return (
    <div className="page">
      {/* Map */}
      <div id="trip-map" style={{ height: '40vh', width: '100%' }} />

      {/* Bottom Panel */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', paddingBottom: '2rem' }}>
        {/* Status */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem' }}>Active Trip</h2>
          <span style={{
            padding: '4px 14px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(13,148,136,0.2)', color: '#0D9488',
          }}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Customer Info */}
        {customer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem', background: 'var(--color-surface-2)', borderRadius: '12px',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{customer.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                ⭐ {customer.rating?.toFixed(1) || '5.0'} · 📱 {customer.phone}
              </div>
            </div>
          </div>
        )}

        {/* Route */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ color: '#0D9488' }}>📍</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>FROM</div>
              <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.pickup?.address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#EF4444' }}>🏁</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>TO</div>
              <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.drop?.address}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>DISTANCE</div>
            <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{booking.distance || '—'} km</div>
          </div>
          <div style={{ flex: 1, padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>FARE</div>
            <div style={{ fontWeight: 700, color: '#10B981' }}>₹{booking.fare?.total || '—'}</div>
          </div>
        </div>

        {/* Action Buttons based on status */}
        {booking.status === 'assigned' && (
          <button className="btn btn-primary btn-full btn-lg" onClick={handleArrive} disabled={actionLoading}>
            {actionLoading ? 'Updating...' : '📍 I Have Arrived'}
          </button>
        )}

        {booking.status === 'driver_arrived' && (
          <div>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '0.75rem', textAlign: 'center' }}>
              Ask the customer for their OTP to start the trip
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="input"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.1em' }}
              />
              <button className="btn btn-primary" onClick={handleVerifyOtp} disabled={otpVerifying}>
                {otpVerifying ? '...' : '✓'}
              </button>
            </div>
          </div>
        )}

        {booking.status === 'otp_verified' && (
          <button className="btn btn-online btn-full btn-lg" onClick={handleStartTrip} disabled={actionLoading}>
            {actionLoading ? 'Starting...' : '🚗 Start Trip'}
          </button>
        )}

        {booking.status === 'started' && (
          <button className="btn btn-accept btn-full btn-lg" onClick={handleCompleteTrip} disabled={actionLoading}>
            {actionLoading ? 'Completing...' : '🏁 Complete Trip'}
          </button>
        )}

        {booking.status === 'completed' && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: '2.5rem' }}>🎉</div>
            <div style={{ fontWeight: 700, color: '#10B981', marginTop: '0.5rem' }}>Trip Completed!</div>
            <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>₹{booking.fare?.total} earned</div>
          </div>
        )}
      </div>
    </div>
  );
}
