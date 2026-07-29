import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

// Leaflet types
declare global {
  interface Window { L: any; }
}

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

const TRIP_TYPES = [
  { type: 'local', icon: '🏙️', name: 'Local', desc: '₹50 base + ₹14/km' },
  { type: 'outstation', icon: '🛣️', name: 'Outstation', desc: '₹200 base + ₹18/km' },
  { type: 'hourly', icon: '⏱️', name: 'Hourly', desc: '₹150/hr + ₹10/km' },
  { type: 'roundtrip', icon: '🔄', name: 'Round Trip', desc: '₹80 base + ₹12/km' },
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tripType, setTripType] = useState<string>(params.get('type') || 'local');
  const [step, setStep] = useState<'type' | 'location' | 'confirm'>('type');
  const [pickup, setPickup] = useState<any>(null);
  const [drop, setDrop] = useState<any>(null);
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [fare, setFare] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);
  const idempotencyKey = useRef(uuidv4());

  useEffect(() => {
    if (step === 'location') {
      setTimeout(initMap, 100);
    }
  }, [step]);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;

    // Import Leaflet dynamically
    const mapEl = document.getElementById('booking-map');
    if (!mapEl) return;

    const map = L.map(mapEl, { zoomControl: false }).setView([PUNE_CENTER.lat, PUNE_CENTER.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click to set pickup then drop
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      if (!pickup) {
        setPickup({ lat, lng });
        setPickupText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#0D9488', fillOpacity: 1, color: 'white', weight: 2,
        }).addTo(map).bindPopup('📍 Pickup').openPopup();
      } else {
        setDrop({ lat, lng });
        setDropText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (dropMarkerRef.current) map.removeLayer(dropMarkerRef.current);
        dropMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#EF4444', fillOpacity: 1, color: 'white', weight: 2,
        }).addTo(map).bindPopup('🏁 Drop').openPopup();
      }
    });

    mapRef.current = map;
  };

  const handleEstimateFare = async () => {
    if (!pickup || !drop) {
      toast.error('Please select both pickup and drop locations on the map');
      return;
    }
    setEstimating(true);
    try {
      const res: any = await api.getFareEstimate({
        pickup: { lat: pickup.lat, lng: pickup.lng },
        drop: { lat: drop.lat, lng: drop.lng },
        type: tripType,
      });
      setFare(res.fare);
      setDistance(res.distance);
      setStep('confirm');
    } catch (err: any) {
      toast.error(err.message || 'Failed to estimate fare');
    } finally {
      setEstimating(false);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const booking: any = await api.createBooking({
        type: tripType,
        pickup: { ...pickup, address: pickupText || 'Selected location' },
        drop: { ...drop, address: dropText || 'Selected location' },
      }, idempotencyKey.current);

      // Start searching immediately
      await api.startSearching(booking._id);

      toast.success('Booking confirmed! Finding your driver...');
      navigate(`/booking/live/${booking._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  const selectedTripType = TRIP_TYPES.find(t => t.type === tripType);

  return (
    <div className="page" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '0.25rem' }}>
          ← Back
        </button>
        <span style={{ fontWeight: 700 }}>Book a Driver</span>
        <div style={{ width: '60px' }} />
      </nav>

      {/* Step: Trip Type */}
      {step === 'type' && (
        <div style={{ padding: '1.5rem' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Choose Trip Type</h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Select what kind of trip you need
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {TRIP_TYPES.map(({ type, icon, name, desc }) => (
              <button
                key={type}
                onClick={() => setTripType(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1.25rem',
                  background: tripType === type ? 'rgba(13,148,136,0.1)' : 'var(--color-surface)',
                  border: `2px solid ${tripType === type ? '#0D9488' : 'var(--color-border)'}`,
                  borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: tripType === type ? 'rgba(13,148,136,0.2)' : 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{desc}</div>
                </div>
                {tripType === type && (
                  <div style={{ color: '#0D9488', fontSize: '1.25rem' }}>✓</div>
                )}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '2rem' }}
            onClick={() => setStep('location')}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step: Select Locations on Map */}
      {step === 'location' && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Map */}
          <div id="booking-map" style={{ flex: 1, minHeight: '400px' }} />

          {/* Bottom Panel */}
          <div style={{
            background: 'var(--color-surface)', padding: '1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1rem' }}>
              {!pickup ? '📍 Tap the map to set your pickup location' :
               !drop ? '🏁 Now tap to set your drop location' :
               '✅ Both locations set!'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px', border: '1px solid rgba(13,148,136,0.3)' }}>
                <div style={{ fontSize: '0.7rem', color: '#0D9488', fontWeight: 600, marginBottom: '2px' }}>FROM</div>
                <div style={{ fontSize: '0.85rem', color: pickup ? '#F1F5F9' : '#64748B' }}>
                  {pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : 'Select on map'}
                </div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600, marginBottom: '2px' }}>TO</div>
                <div style={{ fontSize: '0.85rem', color: drop ? '#F1F5F9' : '#64748B' }}>
                  {drop ? `${drop.lat.toFixed(4)}, ${drop.lng.toFixed(4)}` : 'Select on map'}
                </div>
              </div>
            </div>

            {pickup && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPickup(null);
                  setDrop(null);
                  if (pickupMarkerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(pickupMarkerRef.current);
                  }
                  if (dropMarkerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(dropMarkerRef.current);
                  }
                }}
                style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: '#EF4444' }}
              >
                🔄 Reset locations
              </button>
            )}

            <button
              className="btn btn-primary btn-full"
              onClick={handleEstimateFare}
              disabled={!pickup || !drop || estimating}
            >
              {estimating ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : null}
              {estimating ? 'Calculating...' : 'Get Fare Estimate →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirm + Fare Breakdown */}
      {step === 'confirm' && fare && (
        <div style={{ padding: '1.5rem' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Confirm Booking</h2>
          <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {selectedTripType?.icon} {selectedTripType?.name} · {distance} km
          </p>

          {/* Locations */}
          <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0D9488' }} />
                <div style={{ width: '2px', height: '32px', background: 'var(--color-border)' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#EF4444' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#0D9488', fontWeight: 600 }}>PICKUP</div>
                  <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>
                    {pickup?.lat.toFixed(4)}, {pickup?.lng.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>DROP</div>
                  <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>
                    {drop?.lat.toFixed(4)}, {drop?.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>💰 Fare Breakdown</h3>
            <div className="fare-row">
              <span>Base fare</span>
              <span>₹{fare.base}</span>
            </div>
            <div className="fare-row">
              <span>Distance ({distance} km × ₹{Math.round(fare.distance / distance)}/km)</span>
              <span>₹{fare.distance}</span>
            </div>
            <div className="fare-row">
              <span>Time charges</span>
              <span>₹{fare.time}</span>
            </div>
            {fare.tolls > 0 && (
              <div className="fare-row">
                <span>Tolls (estimated)</span>
                <span>₹{fare.tolls}</span>
              </div>
            )}
            <div className="divider" />
            <div className="fare-row">
              <span style={{ fontWeight: 700, color: '#F1F5F9' }}>Total Estimate</span>
              <span className="fare-total">₹{fare.total}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.75rem' }}>
              * Final fare may vary based on actual distance and time. Tolls are charged extra if applicable.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setStep('location')}
            >
              ← Change
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : null}
              {loading ? 'Booking...' : `Confirm ₹${fare.total}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
