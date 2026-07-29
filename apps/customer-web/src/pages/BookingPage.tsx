import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

declare global { interface Window { L: any; } }

const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

const TRIP_TYPES = [
  { type: 'local',      name: 'Local',      desc: '₹50 base + ₹14/km' },
  { type: 'outstation', name: 'Outstation', desc: '₹200 base + ₹18/km' },
  { type: 'hourly',     name: 'Hourly',     desc: '₹150/hr + ₹10/km' },
  { type: 'roundtrip',  name: 'Round Trip', desc: '₹80 base + ₹12/km' },
];

/* ── Icons ────────────────────────────────────────────────────────── */
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
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
function IconArrowRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 14, height: 14 }}>
      <path d="M14 2v4h-4M2 14v-4h4M2 10A6 6 0 0112.3 5M14 6a6 6 0 01-10.3 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    if (step === 'location') setTimeout(initMap, 100);
  }, [step]);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;
    const mapEl = document.getElementById('booking-map');
    if (!mapEl) return;
    const map = L.map(mapEl, { zoomControl: false }).setView([PUNE_CENTER.lat, PUNE_CENTER.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      if (!pickup) {
        setPickup({ lat, lng });
        setPickupText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 9, fillColor: '#0D9488', fillOpacity: 1, color: 'white', weight: 2.5,
        }).addTo(map).bindPopup('Pickup').openPopup();
      } else {
        setDrop({ lat, lng });
        setDropText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (dropMarkerRef.current) map.removeLayer(dropMarkerRef.current);
        dropMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 9, fillColor: '#EF4444', fillOpacity: 1, color: 'white', weight: 2.5,
        }).addTo(map).bindPopup('Drop').openPopup();
      }
    });
    mapRef.current = map;
  };

  const handleEstimateFare = async () => {
    if (!pickup || !drop) { toast.error('Select both pickup and drop on the map'); return; }
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
      await api.startSearching(booking._id);
      toast.success('Booking confirmed! Finding your driver...');
      navigate(`/booking/live/${booking._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  const resetLocations = () => {
    setPickup(null); setDrop(null);
    if (pickupMarkerRef.current && mapRef.current) mapRef.current.removeLayer(pickupMarkerRef.current);
    if (dropMarkerRef.current && mapRef.current) mapRef.current.removeLayer(dropMarkerRef.current);
    pickupMarkerRef.current = null; dropMarkerRef.current = null;
  };

  const selectedType = TRIP_TYPES.find(t => t.type === tripType);

  return (
    <div className="page">
      {/* Header */}
      <nav className="navbar">
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ padding: '0.25rem', gap: '0.25rem' }}
        >
          <IconChevronLeft />
          Back
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Book a Driver</span>
        <div style={{ width: 60 }} />
      </nav>

      {/* Step 1 — Trip Type */}
      {step === 'type' && (
        <div style={{ padding: '1.5rem' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.375rem' }}>Choose Trip Type</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Select what kind of trip you need
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {TRIP_TYPES.map(({ type, name, desc }) => (
              <button
                key={type}
                className={`trip-type-card ${tripType === type ? 'selected' : ''}`}
                onClick={() => setTripType(type)}
              >
                <div className={`trip-type-icon-wrap ${tripType === type ? 'selected' : ''}`} style={{ color: 'var(--color-primary)' }}>
                  {tripType === type ? <IconCheck /> : null}
                  {tripType !== type && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--color-text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="trip-type-name">{name}</div>
                  <div className="trip-type-desc">{desc}</div>
                </div>
                {tripType === type && (
                  <div style={{ color: 'var(--color-primary)' }}>
                    <IconCheck />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1.75rem', gap: '0.5rem' }}
            onClick={() => setStep('location')}
          >
            Continue
            <IconArrowRight />
          </button>
        </div>
      )}

      {/* Step 2 — Map */}
      {step === 'location' && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div id="booking-map" style={{ flex: 1, minHeight: 380 }} />

          <div style={{
            background: 'var(--color-surface)',
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>
              {!pickup
                ? 'Tap the map to set your pickup location'
                : !drop
                ? 'Now tap to set your drop location'
                : 'Both locations set'}
            </p>

            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div style={{
                flex: 1, padding: '0.625rem 0.75rem',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(13,148,136,0.3)',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 2 }}>PICKUP</div>
                <div style={{ fontSize: '0.8rem', color: pickup ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
                  {pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : 'Tap map'}
                </div>
              </div>
              <div style={{
                flex: 1, padding: '0.625rem 0.75rem',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700, marginBottom: 2 }}>DROP</div>
                <div style={{ fontSize: '0.8rem', color: drop ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>
                  {drop ? `${drop.lat.toFixed(4)}, ${drop.lng.toFixed(4)}` : 'Tap map'}
                </div>
              </div>
            </div>

            {pickup && (
              <button
                className="btn btn-ghost"
                onClick={resetLocations}
                style={{ fontSize: '0.78rem', color: 'var(--color-error)', marginBottom: '0.625rem', gap: '0.3rem' }}
              >
                <IconRefresh />
                Reset locations
              </button>
            )}

            <button
              className="btn btn-primary btn-full"
              onClick={handleEstimateFare}
              disabled={!pickup || !drop || estimating}
            >
              {estimating && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {estimating ? 'Calculating...' : 'Get Fare Estimate'}
              {!estimating && <IconArrowRight />}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 'confirm' && fare && (
        <div style={{ padding: '1.5rem' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Confirm Booking</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {selectedType?.name} &nbsp;&middot;&nbsp; {distance} km
          </p>

          {/* Route */}
          <div className="card" style={{ marginBottom: '0.875rem', padding: '1.125rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />
                <div style={{ width: 2, height: 28, background: 'var(--color-border-strong)' }} />
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700 }}>PICKUP</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {pickup?.lat.toFixed(4)}, {pickup?.lng.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700 }}>DROP</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {drop?.lat.toFixed(4)}, {drop?.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.125rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.875rem' }}>Fare Breakdown</h3>
            <div className="fare-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Base fare</span>
              <span style={{ fontWeight: 500 }}>₹{fare.base}</span>
            </div>
            <div className="fare-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Distance ({distance} km &times; ₹{Math.round(fare.distance / distance)}/km)
              </span>
              <span style={{ fontWeight: 500 }}>₹{fare.distance}</span>
            </div>
            <div className="fare-row">
              <span style={{ color: 'var(--color-text-secondary)' }}>Time charges</span>
              <span style={{ fontWeight: 500 }}>₹{fare.time}</span>
            </div>
            {fare.tolls > 0 && (
              <div className="fare-row">
                <span style={{ color: 'var(--color-text-secondary)' }}>Tolls (estimated)</span>
                <span style={{ fontWeight: 500 }}>₹{fare.tolls}</span>
              </div>
            )}
            <div className="divider" />
            <div className="fare-row">
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Total Estimate</span>
              <span className="fare-total">₹{fare.total}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.625rem' }}>
              Final fare may vary. Tolls are charged extra if applicable.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setStep('location')}
            >
              <IconChevronLeft />
              Change
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {loading ? 'Booking...' : `Confirm · ₹${fare.total}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
