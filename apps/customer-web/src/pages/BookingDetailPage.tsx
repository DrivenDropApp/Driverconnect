import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const data = await api.getBooking(id!) as any;
      setBooking(data);
    } catch {
      toast.error('Failed to load booking');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setRatingSubmitting(true);
    try {
      await api.rateBooking(id!, { stars: rating, comment, tags: [] });
      setRated(true);
      toast.success('Thanks for your rating! ⭐');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/history')} style={{ padding: '0.25rem' }}>← Back</button>
        <span style={{ fontWeight: 700 }}>Trip Summary</span>
        <div style={{ width: '60px' }} />
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Status Banner */}
        <div style={{
          background: booking.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${booking.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {booking.status === 'completed' ? '✅' : '❌'}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#F1F5F9' }}>
            {booking.status === 'completed' ? 'Trip Completed' : `Trip ${booking.status}`}
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </div>
        </div>

        {/* Driver Info */}
        {booking.driverId && typeof booking.driverId === 'object' && (
          <div className="driver-card" style={{ marginBottom: '1rem' }}>
            <img
              src={booking.driverId.kyc?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.driverId.name}`}
              alt={booking.driverId.name}
              className="driver-avatar"
            />
            <div style={{ flex: 1 }}>
              <div className="driver-name">{booking.driverId.name}</div>
              <div className="driver-meta">⭐ {booking.driverId.rating?.toFixed(1) || '5.0'} · {booking.driverId.totalTrips || 0} trips</div>
            </div>
            {booking.driverId.kyc?.status === 'verified' && (
              <div className="verified-badge">
                <span className="badge badge-verified">✓ Verified</span>
              </div>
            )}
          </div>
        )}

        {/* Route */}
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🗺️ Route</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: '#0D9488' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>FROM</div>
                <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.pickup?.address}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: '#EF4444' }}>🏁</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>TO</div>
                <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>{booking.drop?.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        {booking.fare && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>💰 Fare Breakdown</h3>
            <div className="fare-row"><span>Base fare</span><span>₹{booking.fare.base}</span></div>
            <div className="fare-row"><span>Distance</span><span>₹{booking.fare.distance}</span></div>
            <div className="fare-row"><span>Time</span><span>₹{booking.fare.time}</span></div>
            {booking.fare.tolls > 0 && <div className="fare-row"><span>Tolls</span><span>₹{booking.fare.tolls}</span></div>}
            <div className="divider" />
            <div className="fare-row">
              <span style={{ fontWeight: 700 }}>Total</span>
              <span className="fare-total">₹{booking.fare.total}</span>
            </div>
          </div>
        )}

        {/* Rating */}
        {booking.status === 'completed' && !rated && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Rate your driver</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '2rem', transition: 'transform 0.1s',
                    filter: star <= rating ? 'none' : 'grayscale(100%)',
                    transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              className="input"
              placeholder="Any comments? (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              style={{ resize: 'none', marginBottom: '1rem' }}
            />
            <button
              className="btn btn-primary btn-full"
              onClick={handleRate}
              disabled={rating === 0 || ratingSubmitting}
            >
              {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        )}

        {rated && (
          <div style={{
            textAlign: 'center', padding: '1.5rem',
            background: 'rgba(16,185,129,0.1)', borderRadius: '14px',
            border: '1px solid rgba(16,185,129,0.3)',
          }}>
            <div style={{ fontSize: '2rem' }}>🎉</div>
            <p style={{ color: '#10B981', fontWeight: 600, marginTop: '0.5rem' }}>Rating submitted! Thank you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
