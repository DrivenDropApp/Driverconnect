import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';

export default function KycQueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadQueue(); }, [filter]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.getKycQueue(filter);
      setItems(data.items || data || []);
    } catch { toast.error('Failed to load KYC queue'); }
    finally { setLoading(false); }
  };

  const handleDecision = async (driverId: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason) {
      toast.error('Enter a rejection reason');
      return;
    }
    setProcessing(driverId + status);
    try {
      await adminApi.kycDecision(driverId, status, rejectionReason || undefined);
      toast.success(`Driver KYC ${status}!`);
      setSelectedDriver(null);
      setRejectionReason('');
      loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem' }}>KYC Queue</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Review and approve driver documents</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['pending', 'verified', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            No {filter} KYC applications
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>KYC Status</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((driver: any) => (
                <tr key={driver._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={driver.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${driver.name}`}
                        alt=""
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{driver.name}</span>
                    </div>
                  </td>
                  <td>{driver.phone}</td>
                  <td>
                    <span className={`badge badge-${driver.kyc?.status || 'pending'}`}>
                      {driver.kyc?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {driver.kyc?.licenseUrl && <span style={{ fontSize: '0.65rem', background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '4px' }}>License ✓</span>}
                      {driver.kyc?.aadhaarUrl && <span style={{ fontSize: '0.65rem', background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '4px' }}>Aadhaar ✓</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDriver(driver)}>
                        👁 Review
                      </button>
                      {filter === 'pending' && (
                        <>
                          <button
                            className="btn btn-approve btn-sm"
                            onClick={() => handleDecision(driver._id, 'verified')}
                            disabled={!!processing}
                          >
                            {processing === driver._id + 'verified' ? '...' : '✓ Approve'}
                          </button>
                          <button
                            className="btn btn-reject btn-sm"
                            onClick={() => { setSelectedDriver(driver); setRejectionReason(''); }}
                            disabled={!!processing}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedDriver && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Driver KYC Review</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDriver(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <img
                src={selectedDriver.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedDriver.name}`}
                alt=""
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#E2E8F0' }}>{selectedDriver.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{selectedDriver.phone}</div>
                <span className={`badge badge-${selectedDriver.kyc?.status || 'pending'}`} style={{ marginTop: '4px' }}>
                  {selectedDriver.kyc?.status || 'pending'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'License', url: selectedDriver.kyc?.licenseUrl },
                { label: 'Aadhaar', url: selectedDriver.kyc?.aadhaarUrl },
              ].map(({ label, url }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', background: 'var(--color-surface-2)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{label}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Doc</a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Not uploaded</span>
                  )}
                </div>
              ))}
            </div>

            {selectedDriver.kyc?.status === 'pending' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>REJECTION REASON (required to reject)</label>
                  <textarea
                    className="input"
                    style={{ width: '100%', resize: 'none' }}
                    rows={2}
                    placeholder="e.g. License is blurry, please re-upload"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-reject"
                    style={{ flex: 1 }}
                    onClick={() => handleDecision(selectedDriver._id, 'rejected')}
                    disabled={!!processing || !rejectionReason}
                  >
                    {processing === selectedDriver._id + 'rejected' ? '...' : '✕ Reject'}
                  </button>
                  <button
                    className="btn btn-approve"
                    style={{ flex: 1 }}
                    onClick={() => handleDecision(selectedDriver._id, 'verified')}
                    disabled={!!processing}
                  >
                    {processing === selectedDriver._id + 'verified' ? '...' : '✓ Approve KYC'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
