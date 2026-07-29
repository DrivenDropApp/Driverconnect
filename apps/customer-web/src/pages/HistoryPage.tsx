import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async (cursor?: string) => {
    if (!cursor) setLoading(true);
    else setLoadingMore(true);

    try {
      const res: any = await api.getMyBookings(cursor, filter || undefined);
      if (cursor) {
        setBookings(prev => [...prev, ...res.items]);
      } else {
        setBookings(res.items);
      }
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: any) {
      toast.error('Failed to load trip history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const statusColors: Record<string, string> = {
    completed: '#10B981', cancelled: '#EF4444', searching: '#F59E0B',
    assigned: '#818CF8', started: '#10B981', paid: '#10B981', closed: '#64748B',
  };

  const statusEmoji: Record<string, string> = {
    completed: '✅', cancelled: '❌', searching: '🔍',
    assigned: '🚗', started: '🛣️', paid: '💳', closed: '📋',
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem' }}>← Home</button>
        <span style={{ fontWeight: 700 }}>My Trips</span>
        <div style={{ width: '60px' }} />
      </nav>

      {/* Filter Tabs */}
      <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0' }}>
        {['', 'completed', 'cancelled', 'searching'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
              background: filter === f ? '#0D9488' : 'var(--color-surface-2)',
              color: filter === f ? 'white' : '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No trips yet</h3>
            <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Book your first driver ride now!
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/booking/new')}>
              Book a Driver
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bookings.map((booking) => (
              <Link
                key={booking._id}
                to={['searching', 'assigned', 'driver_arrived', 'otp_verified', 'started'].includes(booking.status)
                  ? `/booking/live/${booking._id}`
                  : `/booking/${booking._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: booking.status === 'searching' ? 'rgba(245,158,11,0.3)' : 'var(--color-border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = booking.status === 'searching' ? 'rgba(245,158,11,0.3)' : 'var(--color-border)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{statusEmoji[booking.status] || '📋'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9' }}>
                          {booking.type?.charAt(0).toUpperCase() + booking.type?.slice(1)} Trip
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                      background: `${statusColors[booking.status] || '#94A3B8'}20`,
                      color: statusColors[booking.status] || '#94A3B8',
                    }}>
                      {booking.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#0D9488', fontSize: '0.8rem' }}>📍</span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{booking.pickup?.address || 'Pickup'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>🏁</span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{booking.drop?.address || 'Drop'}</span>
                  </div>

                  {booking.fare && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{booking.distance || '—'} km</span>
                      <span style={{ fontWeight: 700, color: '#0D9488' }}>₹{booking.fare.total}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}

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
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/history" className="tab-item active">
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span>Trips</span>
        </Link>
        <Link to="/profile" className="tab-item">
          <span style={{ fontSize: '1.25rem' }}>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
