import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../lib/api';

function IconEye() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"
      style={{ width: 13, height: 13 }}>
      <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" />
      <circle cx="7" cy="7" r="1.75" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 12, height: 12 }}>
      <path d="M2.5 7l3.5 3.5 5.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 12, height: 12 }}>
      <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
    </svg>
  );
}

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
      toast.success(`Driver KYC ${status}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">KYC Queue</h1>
          <p className="page-subtitle">Review and approve driver documents</p>
        </div>
        <div className="filter-tabs">
          {['pending', 'verified', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No {filter} KYC applications</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((driver: any) => (
                <tr key={driver._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <img
                        src={driver.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${driver.name}`}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{driver.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{driver.phone}</td>
                  <td>
                    <span className={`badge badge-${driver.kyc?.status || 'pending'}`}>
                      {driver.kyc?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {driver.kyc?.licenseUrl && (
                        <span style={{
                          fontSize: '0.62rem', background: 'var(--color-surface-3)',
                          color: 'var(--color-text-secondary)', padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          License
                        </span>
                      )}
                      {driver.kyc?.aadhaarUrl && (
                        <span style={{
                          fontSize: '0.62rem', background: 'var(--color-surface-3)',
                          color: 'var(--color-text-secondary)', padding: '2px 7px',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          Aadhaar
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedDriver(driver)}
                        style={{ gap: '0.3rem' }}
                      >
                        <IconEye /> Review
                      </button>
                      {filter === 'pending' && (
                        <>
                          <button
                            className="btn btn-approve btn-sm"
                            onClick={() => handleDecision(driver._id, 'verified')}
                            disabled={!!processing}
                            style={{ gap: '0.3rem' }}
                          >
                            <IconCheck />
                            {processing === driver._id + 'verified' ? '...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-reject btn-sm"
                            onClick={() => { setSelectedDriver(driver); setRejectionReason(''); }}
                            disabled={!!processing}
                            style={{ gap: '0.3rem' }}
                          >
                            <IconClose />
                            Reject
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
              <h2 className="modal-title">KYC Review</h2>
              <button className="modal-close" onClick={() => setSelectedDriver(null)}>
                <IconClose />
              </button>
            </div>

            {/* Driver profile */}
            <div className="driver-profile-row">
              <img
                src={selectedDriver.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedDriver.name}`}
                alt=""
                className="driver-avatar-lg"
              />
              <div>
                <div className="driver-name-lg">{selectedDriver.name}</div>
                <div className="driver-phone">{selectedDriver.phone}</div>
                <span className={`badge badge-${selectedDriver.kyc?.status || 'pending'}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                  {selectedDriver.kyc?.status || 'pending'}
                </span>
              </div>
            </div>

            {/* Documents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Driving License', url: selectedDriver.kyc?.licenseUrl },
                { label: 'Aadhaar Card',    url: selectedDriver.kyc?.aadhaarUrl },
              ].map(({ label, url }) => (
                <div key={label} className="info-row">
                  <span className="info-row-label">{label}</span>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View Document
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-error)' }}>Not uploaded</span>
                  )}
                </div>
              ))}
            </div>

            {selectedDriver.kyc?.status === 'pending' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Rejection reason (required to reject)</label>
                  <textarea
                    className="input"
                    style={{ resize: 'none' }}
                    rows={2}
                    placeholder="e.g. License image is blurry, please re-upload"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-reject"
                    style={{ flex: 1, gap: '0.35rem' }}
                    onClick={() => handleDecision(selectedDriver._id, 'rejected')}
                    disabled={!!processing || !rejectionReason}
                  >
                    <IconClose />
                    {processing === selectedDriver._id + 'rejected' ? '...' : 'Reject'}
                  </button>
                  <button
                    className="btn btn-approve"
                    style={{ flex: 1, gap: '0.35rem' }}
                    onClick={() => handleDecision(selectedDriver._id, 'verified')}
                    disabled={!!processing}
                  >
                    <IconCheck />
                    {processing === selectedDriver._id + 'verified' ? '...' : 'Approve KYC'}
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
