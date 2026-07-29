import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';

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

  const STATUS_COLORS: Record<string, string> = {
    completed: '#10B981', cancelled: '#EF4444', searching: '#F59E0B',
    assigned: '#3B82F6', started: '#10B981', created: '#94A3B8',
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem' }}>Bookings</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>All platform bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'searching', 'assigned', 'started', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>
              {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} /></div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
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
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No bookings found</td></tr>
                ) : bookings.map((b: any) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#64748B' }}>{b._id.slice(-8)}</td>
                    <td>{b.type}</td>
                    <td>{typeof b.customerId === 'object' ? b.customerId?.name : '—'}</td>
                    <td>{typeof b.driverId === 'object' ? b.driverId?.name : (b.driverId ? '—' : 'Unassigned')}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600,
                        background: `${STATUS_COLORS[b.status] || '#94A3B8'}18`,
                        color: STATUS_COLORS[b.status] || '#94A3B8',
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td>₹{b.fare?.total || '—'}</td>
                    <td>{b.distance ? `${b.distance} km` : '—'}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextCursor && (
              <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-secondary" onClick={() => loadBookings(nextCursor)}>Load more</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
