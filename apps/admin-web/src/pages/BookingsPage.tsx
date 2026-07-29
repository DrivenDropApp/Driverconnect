import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  completed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  cancelled:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  searching:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  assigned:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  started:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  created:    { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const FILTERS = ['', 'searching', 'assigned', 'started', 'completed', 'cancelled'];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => { loadBookings(); }, [filter]);

  const loadBookings = async (cursor?: string) => {
    if (!cursor) setLoading(true);
    try {
      const data: any = await adminApi.getBookings(filter || undefined, cursor);
      if (cursor) setBookings(prev => [...prev, ...(data.items || [])]);
      else setBookings(data.items || []);
      setNextCursor(data.nextCursor);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">All platform bookings</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
            >
              {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Fare</th>
                  <th>Distance</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <p className="empty-state-text">No bookings found</p>
                      </div>
                    </td>
                  </tr>
                ) : bookings.map((b: any) => {
                  const sc = STATUS_CONFIG[b.status] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
                  return (
                    <tr key={b._id}>
                      <td>
                        <span className="mono">{b._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{b.type}</td>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {typeof b.customerId === 'object' ? b.customerId?.name : '—'}
                      </td>
                      <td>
                        {typeof b.driverId === 'object' ? b.driverId?.name : (b.driverId ? '—' : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.72rem' }}>Unassigned</span>
                        ))}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.67rem',
                          fontWeight: 600,
                          background: sc.bg,
                          color: sc.color,
                          textTransform: 'capitalize',
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {b.fare?.total ? `\u20B9${b.fare.total}` : '—'}
                      </td>
                      <td>{b.distance ? `${b.distance} km` : '—'}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                        {new Date(b.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {nextCursor && (
              <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-secondary" onClick={() => loadBookings(nextCursor)}>
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
