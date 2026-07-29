import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('');

  useEffect(() => { load(); }, [kycFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.getDrivers(kycFilter || undefined);
      setDrivers(data.items || data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleSuspend = async (driverId: string, name: string) => {
    if (!window.confirm(`Suspend ${name}? They will be taken offline.`)) return;
    try {
      await adminApi.suspendDriver(driverId);
      toast.success(`${name} suspended`);
      load();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem' }}>Drivers</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Manage all drivers</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[['', 'All'], ['pending', 'KYC Pending'], ['verified', 'Verified'], ['rejected', 'Rejected']].map(([val, label]) => (
            <button key={val} onClick={() => setKycFilter(val)} className={`btn ${kycFilter === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Trips</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>No drivers found</td></tr>
              ) : drivers.map((d: any) => (
                <tr key={d._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={d.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${d.name}`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{d.name}</span>
                    </div>
                  </td>
                  <td>{d.phone}</td>
                  <td><span className={`badge badge-${d.kyc?.status || 'pending'}`}>{d.kyc?.status || 'pending'}</span></td>
                  <td><span className={`badge ${d.isOnline ? 'badge-online' : 'badge-offline'}`}>{d.isOnline ? '● Online' : '○ Offline'}</span></td>
                  <td>⭐ {d.rating?.toFixed(1) || '—'}</td>
                  <td>{d.totalTrips || 0}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(d._id, d.name)}>
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
