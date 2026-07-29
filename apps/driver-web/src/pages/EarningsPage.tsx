import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { driverApi } from '../lib/api';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function IconMapPin() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ width: 13, height: 13, flexShrink: 0 }}>
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1C4.5 1 2.5 3 2.5 5.5c0 3.5 4.5 7.5 4.5 7.5s4.5-4 4.5-7.5C11.5 3 9.5 1 7 1z" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 48, height: 48, opacity: 0.3 }}>
      <rect x="6" y="28" width="8" height="12" rx="2" />
      <rect x="20" y="18" width="8" height="22" rx="2" />
      <rect x="34" y="8" width="8" height="32" rx="2" />
    </svg>
  );
}

export default function EarningsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('today');
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEarnings(); }, [period]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const data: any = await driverApi.getEarnings(period);
      setEarnings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const periods: { value: string; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week',  label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Navbar */}
      <nav className="navbar">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ padding: '0.25rem', gap: 4 }}
        >
          <IconChevronLeft />
          Back
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Earnings</span>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
        {/* Period Tabs */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
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
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            {/* Earnings Hero */}
            <div className="earnings-hero animate-fade-in" style={{ marginBottom: 'var(--sp-4)' }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'var(--sp-3)',
              }}>
                Total Earnings
              </div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: 'var(--color-success)',
                lineHeight: 1,
                marginBottom: 'var(--sp-2)',
              }}>
                &#x20B9;{earnings?.totalEarnings || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {earnings?.tripCount || 0} trip{earnings?.tripCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Trip List */}
            {(earnings?.trips?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-10) 0' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}>
                  <IconBarChart />
                </div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 'var(--sp-2)' }}>No trips this period</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Go online to start earning
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Trip Breakdown
                </h3>
                {earnings.trips.map((trip: any) => (
                  <div key={trip._id} className="trip-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                        {trip.type} Trip
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
                        }}>
                          <IconMapPin />
                          {trip.drop.address}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-success)' }}>
                        &#x20B9;{trip.fare?.total || 0}
                      </div>
                      {trip.distance && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
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
          <IconHome />
          <span>Home</span>
        </Link>
        <Link to="/earnings" className="tab-item active">
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
