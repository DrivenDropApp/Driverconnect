import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverApi } from '../lib/api';

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
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem' }}>← Back</button>
        <span style={{ fontWeight: 700 }}>Earnings</span>
        <div style={{ width: '60px' }} />
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Period Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{
              flex: 1, padding: '0.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600,
              background: period === val ? '#0D9488' : 'var(--color-surface-2)',
              color: period === val ? 'white' : '#94A3B8',
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <>
            <div style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(15,118,110,0.1))', border: '1px solid rgba(13,148,136,0.3)', borderRadius: '20px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '0.5rem' }}>TOTAL EARNINGS</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10B981' }}>₹{earnings?.totalEarnings || 0}</div>
              <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.5rem' }}>{earnings?.tripCount || 0} trips</div>
            </div>

            {(earnings?.trips?.length || 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '2.5rem' }}>📊</div>
                <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>No trips this period</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {earnings.trips.map((trip: any) => (
                  <div key={trip._id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F1F5F9' }}>{trip.type?.charAt(0).toUpperCase() + trip.type?.slice(1)} Trip</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{trip.distance || '—'} km</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>₹{trip.fare?.total || 0}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <nav className="tab-bar">
        <button onClick={() => navigate('/')} className="tab-item"><span style={{ fontSize: '1.25rem' }}>🏠</span><span>Home</span></button>
        <button onClick={() => navigate('/earnings')} className="tab-item active"><span style={{ fontSize: '1.25rem' }}>💰</span><span>Earnings</span></button>
        <button onClick={() => navigate('/profile')} className="tab-item"><span style={{ fontSize: '1.25rem' }}>👤</span><span>Profile</span></button>
      </nav>
    </div>
  );
}
