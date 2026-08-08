import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverApi } from '../lib/api';

/* ── Icons ───────────────────────────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
    </svg>
  );
}
function IconCash() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 22, height: 22 }}>
      <rect x="2" y="6" width="18" height="12" rx="2" />
      <circle cx="11" cy="12" r="3" />
      <path d="M6 6V5a1 1 0 011-1h8a1 1 0 011 1v1" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <circle cx="11" cy="7" r="4" />
      <path d="M2 20c0-4.5 4-7 9-7s9 2.5 9 7" strokeLinecap="round" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12, flexShrink: 0 }}>
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1C4.5 1 2.5 3 2.5 5.5c0 3.5 4.5 7.5 4.5 7.5s4.5-4 4.5-7.5C11.5 3 9.5 1 7 1z" />
    </svg>
  );
}
function IconEmptyChart() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 72, height: 72 }}>
      {/* Car body */}
      <rect x="15" y="42" width="50" height="20" rx="6" stroke="currentColor" opacity="0.4" />
      <path d="M22 42l8-14h20l8 14" stroke="currentColor" opacity="0.4" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="27" cy="62" r="7" stroke="currentColor" opacity="0.35" />
      <circle cx="53" cy="62" r="7" stroke="currentColor" opacity="0.35" />
      {/* Road lines */}
      <line x1="10" y1="74" x2="70" y2="74" stroke="currentColor" opacity="0.2" strokeLinecap="round" />
      <line x1="30" y1="74" x2="38" y2="74" stroke="currentColor" opacity="0.5" strokeDasharray="4 6" />
    </svg>
  );
}

/* ── Animated Car for empty state ───────────────────────────────────────────── */
function BobbingCar() {
  return (
    <div className="animate-bob" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--color-text-muted)' }}>
      <IconEmptyChart />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function EarningsPage() {
  const [period, setPeriod] = useState('today');
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEarnings(); }, [period]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const data: any = await driverApi.getEarnings(period);
      setEarnings(data);
    } catch { } finally {
      setLoading(false);
    }
  };

  const periods: { value: string; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const periodLabel = periods.find(p => p.value === period)?.label || 'Today';

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', gap: 4, fontSize: '0.9rem' }}>
          ← Home
        </Link>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Earnings</span>
        <div style={{ width: 56 }} />
      </nav>

      <div style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>

        {/* ── Period Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-full)',
          marginBottom: 'var(--sp-5)',
          border: '1px solid var(--color-border)',
        }}>
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`period-tab ${period === value ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)' }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : (
          <>
            {/* ── Earnings Hero ── */}
            <div className="earnings-hero animate-fade-in" style={{ marginBottom: 'var(--sp-4)' }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 'var(--sp-2)',
                position: 'relative', zIndex: 1,
              }}>
                {periodLabel} Total
              </div>
              <div style={{
                fontSize: 'clamp(2.5rem, 12vw, 3.5rem)',
                fontWeight: 900,
                color: 'var(--color-success)',
                lineHeight: 1,
                marginBottom: 'var(--sp-2)',
                letterSpacing: '-0.04em',
                position: 'relative', zIndex: 1,
              }}>
                ₹{earnings?.totalEarnings || 0}
              </div>
              <div style={{
                fontSize: '0.85rem', color: 'var(--color-text-muted)',
                position: 'relative', zIndex: 1,
              }}>
                {earnings?.tripCount || 0} trip{earnings?.tripCount !== 1 ? 's' : ''} completed
              </div>

              {/* Mini stat row */}
              {(earnings?.tripCount || 0) > 0 && (
                <div style={{
                  display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center',
                  marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg / Trip</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
                      ₹{earnings?.tripCount ? Math.round((earnings?.totalEarnings || 0) / earnings.tripCount) : 0}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Trip List ── */}
            {(earnings?.trips?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-10) 0' }} className="animate-fade-in">
                <BobbingCar />
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--sp-2)', fontWeight: 700 }}>
                  No trips this period
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Go online to start earning
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <h3 style={{
                  fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
                }}>
                  Trip Breakdown · {earnings.trips.length} trips
                </h3>
                {earnings.trips.map((trip: any, i: number) => (
                  <div key={trip._id} className="trip-row animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                        {trip.type || 'Standard'} Trip
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {new Date(trip.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      {trip.drop?.address && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: '0.75rem', color: 'var(--color-text-muted)',
                          overflow: 'hidden',
                        }}>
                          <span style={{ color: 'var(--color-error)', flexShrink: 0 }}><IconMapPin /></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {trip.drop.address}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-success)' }}>
                        ₹{trip.fare?.total || 0}
                      </div>
                      {trip.distance && (
                        <div style={{
                          fontSize: '0.7rem', color: 'var(--color-text-muted)',
                          background: 'rgba(255,255,255,0.04)', padding: '2px 8px',
                          borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
                        }}>
                          {trip.distance} km
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tab Bar */}
      <nav className="tab-bar">
        <Link to="/" className="tab-item">
          <span className="tab-icon"><IconHome /></span>
          <span>Home</span>
        </Link>
        <Link to="/earnings" className="tab-item active">
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
