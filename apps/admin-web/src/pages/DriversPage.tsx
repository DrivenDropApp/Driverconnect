import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';

const FILTERS = [['', 'All'], ['pending', 'Pending KYC'], ['verified', 'Verified'], ['rejected', 'Rejected']];

const KYC_FILTER_LABELS: Record<string, string> = {
  '': 'All',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Manage all platform drivers</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setKycFilter(val)}
              className={`filter-tab ${kycFilter === val ? 'active' : ''}`}
            >
              {label}
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
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>KYC Status</th>
                <th>Online</th>
                <th>Rating</th>
                <th>Trips</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p className="empty-state-text">No drivers found for filter: {KYC_FILTER_LABELS[kycFilter]}</p>
                    </div>
                  </td>
                </tr>
              ) : drivers.map((d: any) => (
                <tr key={d._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <img
                        src={d.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${d.name}`}
                        alt=""
                        style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>{d.phone}</td>
                  <td>
                    <span className={`badge badge-${d.kyc?.status || 'pending'}`}>
                      {d.kyc?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${d.isOnline ? 'badge-online' : 'badge-offline'}`}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: d.isOnline ? 'var(--color-success)' : 'var(--color-text-disabled)',
                        display: 'inline-block',
                      }} />
                      {d.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      {d.rating?.toFixed(1) || '—'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{d.totalTrips || 0}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleSuspend(d._id, d.name)}
                    >
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
