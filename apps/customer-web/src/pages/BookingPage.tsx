import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fetchAutocomplete, fetchPlaceDetails, fetchReverseGeocode } from '../lib/olaMaps';

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

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDrop, setSearchingDrop] = useState(false);

  const [fare, setFare] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);
  const idempotencyKey = useRef(uuidv4());

  const pickupTimeoutRef = useRef<any>(null);
  const dropTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (step === 'location') setTimeout(initMap, 100);
  }, [step]);

  const pickupStateRef = useRef<any>(null);
  pickupStateRef.current = pickup;

  const initMap = () => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;
    const mapEl = document.getElementById('booking-map');
    if (!mapEl) return;
    const map = L.map(mapEl, { zoomControl: false }).setView([PUNE_CENTER.lat, PUNE_CENTER.lng], 13);
    const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY;
    if (OLA_API_KEY) {
      L.tileLayer(`https://api.olamaps.io/tiles/raster/v1/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_API_KEY}`, {
        attribution: '© Ola Maps',
        maxZoom: 18,
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    }
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      if (!pickupStateRef.current) {
        setPickup({ lat, lng });
        const address = await fetchReverseGeocode(lat, lng);
        setPickupText(address);
        if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = L.marker([lat, lng], { draggable: true })
          .addTo(map)
          .bindPopup('Pickup')
          .openPopup();

        pickupMarkerRef.current.on('dragend', async (event: any) => {
          const marker = event.target;
          const position = marker.getLatLng();
          const addr = await fetchReverseGeocode(position.lat, position.lng);
          setPickup({ lat: position.lat, lng: position.lng });
          setPickupText(addr);
        });
      } else {
        setDrop({ lat, lng });
        const address = await fetchReverseGeocode(lat, lng);
        setDropText(address);
        if (dropMarkerRef.current) map.removeLayer(dropMarkerRef.current);
        dropMarkerRef.current = L.marker([lat, lng], { draggable: true })
          .addTo(map)
          .bindPopup('Drop')
          .openPopup();

        dropMarkerRef.current.on('dragend', async (event: any) => {
          const marker = event.target;
          const position = marker.getLatLng();
          const addr = await fetchReverseGeocode(position.lat, position.lng);
          setDrop({ lat: position.lat, lng: position.lng });
          setDropText(addr);
        });
      }
    });
    mapRef.current = map;
  };

  const handlePickupChange = (value: string) => {
    setPickupText(value);
    if (pickupTimeoutRef.current) clearTimeout(pickupTimeoutRef.current);
    if (!value.trim()) {
      setPickupSuggestions([]);
      return;
    }
    pickupTimeoutRef.current = setTimeout(async () => {
      setSearchingPickup(true);
      const suggestions = await fetchAutocomplete(value);
      setPickupSuggestions(suggestions);
      setSearchingPickup(false);
    }, 400);
  };

  const handleDropChange = (value: string) => {
    setDropText(value);
    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    if (!value.trim()) {
      setDropSuggestions([]);
      return;
    }
    dropTimeoutRef.current = setTimeout(async () => {
      setSearchingDrop(true);
      const suggestions = await fetchAutocomplete(value);
      setDropSuggestions(suggestions);
      setSearchingDrop(false);
    }, 400);
  };

  const handleSelectPickup = async (suggestion: any) => {
    setPickupSuggestions([]);
    const details = await fetchPlaceDetails(suggestion.place_id);
    if (!details) return;

    setPickup({ lat: details.lat, lng: details.lng });
    setPickupText(details.address || suggestion.description);

    if (mapRef.current) {
      mapRef.current.setView([details.lat, details.lng], 15);
      
      if (pickupMarkerRef.current) mapRef.current.removeLayer(pickupMarkerRef.current);
      const L = (window as any).L;
      pickupMarkerRef.current = L.marker([details.lat, details.lng], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('Pickup')
        .openPopup();

      pickupMarkerRef.current.on('dragend', async (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        const address = await fetchReverseGeocode(position.lat, position.lng);
        setPickup({ lat: position.lat, lng: position.lng });
        setPickupText(address);
      });
    }
  };

  const handleSelectDrop = async (suggestion: any) => {
    setDropSuggestions([]);
    const details = await fetchPlaceDetails(suggestion.place_id);
    if (!details) return;

    setDrop({ lat: details.lat, lng: details.lng });
    setDropText(details.address || suggestion.description);

    if (mapRef.current) {
      mapRef.current.setView([details.lat, details.lng], 15);
      
      if (dropMarkerRef.current) mapRef.current.removeLayer(dropMarkerRef.current);
      const L = (window as any).L;
      dropMarkerRef.current = L.marker([details.lat, details.lng], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('Drop')
        .openPopup();

      dropMarkerRef.current.on('dragend', async (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        const address = await fetchReverseGeocode(position.lat, position.lng);
        setDrop({ lat: position.lat, lng: position.lng });
        setDropText(address);
      });
    }
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
    setPickupText(''); setDropText('');
    setPickupSuggestions([]); setDropSuggestions([]);
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.875rem', position: 'relative' }}>
              {/* Pickup Location Search */}
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>PICKUP LOCATION</div>
                <input
                  type="text"
                  value={pickupText}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  placeholder="Enter pickup address or tap/drag pin"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(13,148,136,0.3)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                {searchingPickup && (
                  <div style={{ position: 'absolute', right: 10, top: 28, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Searching...
                  </div>
                )}
                
                {pickupSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {pickupSuggestions.map((suggestion: any) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => handleSelectPickup(suggestion)}
                        style={{
                          padding: '0.625rem 0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: '0.78rem',
                          color: 'var(--color-text-primary)',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drop Location Search */}
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700, marginBottom: 4 }}>DROP LOCATION</div>
                <input
                  type="text"
                  value={dropText}
                  onChange={(e) => handleDropChange(e.target.value)}
                  placeholder="Enter drop address or tap/drag pin"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                {searchingDrop && (
                  <div style={{ position: 'absolute', right: 10, top: 28, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Searching...
                  </div>
                )}

                {dropSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {dropSuggestions.map((suggestion: any) => (
                      <div
                        key={suggestion.place_id}
                        onClick={() => handleSelectDrop(suggestion)}
                        style={{
                          padding: '0.625rem 0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: '0.78rem',
                          color: 'var(--color-text-primary)',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
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
