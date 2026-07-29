import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

/* ── Icons ────────────────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L11 2l8 7.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}
function IconList() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22 }}>
      <rect x="3" y="5" width="16" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="3" y="10.5" width="16" height="2.5" rx="1.25" />
      <rect x="3" y="16" width="10" height="2.5" rx="1.25" />
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
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMapPin({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5"
      style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1C4.5 1 2.5 3 2.5 5.5c0 3.5 4.5 7.5 4.5 7.5s4.5-4 4.5-7.5C11.5 3 9.5 1 7 1z" />
    </svg>
  );
}
function IconCar() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 40, height: 40, opacity: 0.35 }}>
      <path d="M8 22l3-9h18l3 9" strokeLinecap="round" />
      <rect x="4" y="22" width="32" height="10" rx="3" />
      <circle cx="10" cy="32" r="3" fill="currentColor" stroke="none" />
      <circle cx="30" cy="32" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Completed' },
  cancelled:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Cancelled' },
  searching:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Searching' },
  assigned:   { color: '#818CF8', bg: 'rgba(129,140,248,0.12)',label: 'Assigned' },
  started:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'In Progress' },
  paid:       { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Paid' },
  closed:     { color: '#64748B', bg: 'rgba(100,116,139,0.1)', label: 'Closed' },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => { loadBookings(); }, [filter]);

  const loadBookings = async (cursor?: string) => {
    if (!cursor) setLoading(true); else setLoadingMore(true);
    try {
      const res: any = await api.getMyBookings(cursor, filter || undefined);
      if (cursor) setBookings(prev => [...prev, ...res.items]);
      else setBookings(res.items);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      toast.error('Failed to load trip history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const isActiveStatus = (status: string) =>
    ['searching', 'assigned', 'driver_arrived', 'otp_verified', 'started'].includes(status);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <nav className="navbar">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ padding: '0.25rem', gap: '0.25rem' }}
        >
          <IconChevronLeft />
          Home
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>My Trips</span>
        <div style={{ width: 60 }} />
      </nav>

      {/* Filter Pills */}
      <div style={{ padding: '0.875rem 1.5rem 0', display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['', 'completed', 'cancelled', 'searching'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-pill ${filter === f ? 'active' : ''}`}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 104, borderRadius: 14 }} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <IconCar />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>No trips yet</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Book your first driver ride now
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/booking/new')}>
              Book a Driver
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.875rem' }}>
            {bookings.map((booking) => {
              const sc = STATUS_CONFIG[booking.status] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: booking.status };
              const dest = isActiveStatus(booking.status)
                ? `/booking/live/${booking._id}`
                : `/booking/${booking._id}`;
              return (
                <Link key={booking._id} to={dest} className="booking-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                        {booking.type} Trip
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 9px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.68rem', fontWeight: 700,
                      background: sc.bg, color: sc.color,
                    }}>
                      {sc.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
                      <IconMapPin color="var(--color-primary)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {booking.pickup?.address || 'Pickup location'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
                      <IconMapPin color="#EF4444" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                        {booking.drop?.address || 'Drop location'}
                      </span>
                    </div>
                  </div>

                  {booking.fare && (
                    <div style={{
                      marginTop: '0.75rem', paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {booking.distance || '—'} km
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                        ₹{booking.fare.total}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}

            {hasMore && (
              <button
                className="btn btn-secondary btn-full"
                onClick={() => loadBookings(nextCursor!)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more trips'}
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="tab-bar">
        <Link to="/" className="tab-item">
          <IconHome />
          <span>Home</span>
        </Link>
        <Link to="/history" className="tab-item active">
          <IconList />
          <span>Trips</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <IconUser />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
