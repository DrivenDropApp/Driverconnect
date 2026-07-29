import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { getCustomerSocket } from '../lib/socket';

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const prevDriverLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    loadBooking();
    if (accessToken) {
      setupSocket(accessToken);
    }
    return () => {
      if (socketRef.current) socketRef.current.off();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [id, accessToken]);

  useEffect(() => {
    if (booking) {
      setTimeout(initMap, 100);
    }
  }, [booking]);

  const loadBooking = async () => {
    try {
      const data = await api.getBooking(id!) as any;
      setBooking(data);
    } catch {
      toast.error('Failed to load booking');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = (token: string) => {
    const socket = getCustomerSocket(token);
    socketRef.current = socket;

    socket.on('trip:sync', (data: any) => {
      setBooking(data.booking);
    });

    socket.on('booking:assigned', (data: any) => {
      setBooking(data.booking);
      toast.success('Driver found! On the way...');
      // Re-trigger active trip room join
      socket.emit('join:active');
    });

    // Location updates from driver - animate, don't re-render
    socket.on('location:update', (data: any) => {
      animateMarkerTo(data.lat, data.lng);
    });

    socket.on('booking:status', (data: any) => {
      if (data.bookingId === id) {
        setBooking((prev: any) => ({ ...prev, status: data.status }));
        if (data.status === 'completed') {
          toast.success('Trip completed!');
          setTimeout(() => navigate(`/booking/${id}`), 1500);
        }
      }
    });
  };

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current || !booking) return;
    const mapEl = document.getElementById('live-map');
    if (!mapEl) return;

    const center = booking.pickup || { lat: 18.5204, lng: 73.8567 };
    const map = L.map(mapEl, { zoomControl: false }).setView([center.lat, center.lng], 14);
    
    const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY;
    if (OLA_API_KEY) {
      L.tileLayer(`https://api.olamaps.io/tiles/raster/v1/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_API_KEY}`, {
        attribution: '© Ola Maps',
        maxZoom: 18,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    }

    // Pickup marker
    L.circleMarker([booking.pickup.lat, booking.pickup.lng], {
      radius: 8, fillColor: '#0D9488', fillOpacity: 1, color: 'white', weight: 2,
    }).addTo(map).bindPopup('📍 Pickup');

    // Drop marker
    L.circleMarker([booking.drop.lat, booking.drop.lng], {
      radius: 8, fillColor: '#EF4444', fillOpacity: 1, color: 'white', weight: 2,
    }).addTo(map).bindPopup('🏁 Drop');

    mapRef.current = map;
  };

  // Smooth marker animation using requestAnimationFrame lerp
  const animateMarkerTo = useCallback((targetLat: number, targetLng: number) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const prevLoc = prevDriverLocRef.current;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([targetLat, targetLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#0D9488,#0F766E);border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(13,148,136,0.5)">🚗</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).addTo(mapRef.current);
    }

    if (!prevLoc) {
      prevDriverLocRef.current = { lat: targetLat, lng: targetLng };
      driverMarkerRef.current.setLatLng([targetLat, targetLng]);
      return;
    }

    const startLat = prevLoc.lat;
    const startLng = prevLoc.lng;
    const startTime = performance.now();
    const DURATION = 2500; // Smooth over 2.5s (same as tick interval)

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const lat = startLat + (targetLat - startLat) * eased;
      const lng = startLng + (targetLng - startLng) * eased;
      driverMarkerRef.current?.setLatLng([lat, lng]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevDriverLocRef.current = { lat: targetLat, lng: targetLng };
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    setDriverLocation({ lat: targetLat, lng: targetLng });
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.cancelBooking(id!);
      toast.success('Booking cancelled');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Cannot cancel at this stage');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
        <p style={{ color: '#94A3B8' }}>Loading trip...</p>
      </div>
    );
  }

  if (!booking) return null;

  const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
    searching: { label: 'Finding your driver...', icon: '🔍', color: '#F59E0B' },
    assigned: { label: 'Driver assigned! On the way', icon: '🚗', color: '#818CF8' },
    driver_arrived: { label: 'Driver has arrived!', icon: '📍', color: '#0D9488' },
    otp_verified: { label: 'OTP verified - starting trip', icon: '✅', color: '#0D9488' },
    started: { label: 'Trip in progress', icon: '🛣️', color: '#10B981' },
    completed: { label: 'Trip completed!', icon: '🎉', color: '#10B981' },
  };

  const status = statusConfig[booking.status] || { label: booking.status, icon: '❓', color: '#94A3B8' };

  return (
    <div className="page">
      {/* Map */}
      <div style={{ position: 'relative' }}>
        <div id="live-map" style={{ height: '55vh', width: '100%' }} />

        {/* Status overlay */}
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem', right: '1rem', zIndex: 1000,
          background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)',
          borderRadius: '14px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: `${status.color}20`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.25rem',
            ...(booking.status === 'searching' && {
              animation: 'pulse 2s infinite',
              border: `2px solid ${status.color}`,
            }),
          }}>
            {status.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.9rem' }}>{status.label}</div>
            {booking.status === 'searching' && (
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Connecting to nearby drivers...</div>
            )}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 1000,
            background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            padding: '0.6rem 1rem', color: '#F1F5F9', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
          }}
        >
          ← Home
        </button>
      </div>

      {/* Info Panel */}
      <div style={{ padding: '1.5rem', flex: 1 }}>
        {/* Driver Card - shown when driver is assigned */}
        {booking.driverId && typeof booking.driverId === 'object' && (
          <div className="driver-card animate-fade-in" style={{ marginBottom: '1rem' }}>
            <img
              src={booking.driverId.kyc?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.driverId.name}`}
              alt={booking.driverId.name}
              className="driver-avatar"
              onError={e => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${booking.driverId.name}`;
              }}
            />
            <div style={{ flex: 1 }}>
              <div className="driver-name">{booking.driverId.name}</div>
              <div className="driver-meta">
                ⭐ {booking.driverId.rating?.toFixed(1) || '5.0'} · {booking.driverId.totalTrips || 0} trips
              </div>
              <div className="driver-meta">📱 {booking.driverId.phone}</div>
            </div>
            {booking.driverId.kyc?.status === 'verified' && (
              <div className="verified-badge">
                <span className="badge badge-verified">✓ Verified</span>
              </div>
            )}
          </div>
        )}

        {/* Booking Details */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Trip Details</h3>
            <span className={`status-pill status-${booking.status}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#0D9488', fontSize: '1rem' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>FROM</div>
                <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.pickup?.address || 'Pickup location'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#EF4444', fontSize: '1rem' }}>🏁</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>TO</div>
                <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.drop?.address || 'Drop location'}</div>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Estimated fare</span>
            <span style={{ fontWeight: 700, color: '#0D9488' }}>₹{booking.fare?.total || '—'}</span>
          </div>
        </div>

        {/* Cancel button - only for pre-started statuses */}
        {['searching', 'assigned', 'created'].includes(booking.status) && (
          <button
            className="btn btn-danger btn-full"
            onClick={handleCancel}
          >
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}
