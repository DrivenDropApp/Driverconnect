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
function IconExternalLink() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 12, height: 12 }}>
      <path d="M6 2H2v10h10V8M8 2h4v4M5.5 8.5L12 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 120 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: value ? 'var(--color-text-primary)' : 'var(--color-text-disabled)', textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function DocCard({ label, url }: { label: string; url?: string }) {
  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', background: 'var(--color-surface-2)',
    }}>
      <div style={{
        padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600,
              textDecoration: 'none',
            }}>
            Open <IconExternalLink />
          </a>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-error)' }}>Not uploaded</span>
        )}
      </div>
      {url ? (
        <img src={url} alt={label}
          style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-disabled)', fontSize: '0.78rem' }}>
          No document uploaded
        </div>
      )}
    </div>
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

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
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
            <button key={f} onClick={() => setFilter(f)}
              className={`filter-tab ${filter === f ? 'active' : ''}`}>
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
                <th>Gender</th>
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
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>{driver.name}</span>
                        {driver.email && <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{driver.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{driver.phone}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                    {driver.gender || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${driver.kyc?.status || 'pending'}`}>
                      {driver.kyc?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {driver.kyc?.licenseUrl && (
                        <span style={{ fontSize: '0.62rem', background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>
                          License ✓
                        </span>
                      )}
                      {driver.kyc?.aadhaarUrl && (
                        <span style={{ fontSize: '0.62rem', background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>
                          Aadhaar ✓
                        </span>
                      )}
                      {!driver.kyc?.licenseUrl && !driver.kyc?.aadhaarUrl && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--color-error)' }}>None uploaded</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDriver(driver)} style={{ gap: '0.3rem' }}>
                        <IconEye /> Review
                      </button>
                      {filter === 'pending' && (
                        <>
                          <button className="btn btn-approve btn-sm"
                            onClick={() => handleDecision(driver._id, 'verified')}
                            disabled={!!processing} style={{ gap: '0.3rem' }}>
                            <IconCheck />
                            {processing === driver._id + 'verified' ? '...' : 'Approve'}
                          </button>
                          <button className="btn btn-reject btn-sm"
                            onClick={() => { setSelectedDriver(driver); setRejectionReason(''); }}
                            disabled={!!processing} style={{ gap: '0.3rem' }}>
                            <IconClose /> Reject
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

      {/* ── Review Modal ────────────────────────────────── */}
      {selectedDriver && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}
            style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Driver Info — KYC Review</h2>
              <button className="modal-close" onClick={() => setSelectedDriver(null)}><IconClose /></button>
            </div>

            {/* Driver Avatar + Name */}
            <div className="driver-profile-row">
              <img
                src={selectedDriver.kyc?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedDriver.name}`}
                alt="" className="driver-avatar-lg"
              />
              <div>
                <div className="driver-name-lg">{selectedDriver.name}</div>
                <div className="driver-phone">{selectedDriver.phone}</div>
                <span className={`badge badge-${selectedDriver.kyc?.status || 'pending'}`}
                  style={{ marginTop: 6, display: 'inline-flex' }}>
                  {selectedDriver.kyc?.status || 'pending'}
                </span>
              </div>
            </div>

            {/* Section: Personal Information */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Personal Information
              </h3>
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '0 0.75rem' }}>
                <InfoRow label="Full Name" value={selectedDriver.name} />
                <InfoRow label="Phone" value={`+91 ${selectedDriver.phone}`} />
                <InfoRow label="Gender" value={selectedDriver.gender ? selectedDriver.gender.charAt(0).toUpperCase() + selectedDriver.gender.slice(1) : null} />
                <InfoRow label="Email" value={selectedDriver.email} />
                <InfoRow label="Date of Birth" value={formatDate(selectedDriver.dateOfBirth)} />
                <InfoRow label="Alternate Phone" value={selectedDriver.alternatePhone ? `+91 ${selectedDriver.alternatePhone}` : null} />
                <InfoRow label="Languages" value={selectedDriver.languages?.length ? selectedDriver.languages.join(', ') : null} />
                <InfoRow label="Joined" value={formatDate(selectedDriver.createdAt)} />
              </div>
            </div>

            {/* Section: KYC Documents */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                KYC Documents
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <DocCard label="Driving License" url={selectedDriver.kyc?.licenseUrl} />
                <DocCard label="Aadhaar Card" url={selectedDriver.kyc?.aadhaarUrl} />
              </div>
            </div>

            {/* Rejection reason if previously rejected */}
            {selectedDriver.kyc?.rejectionReason && (
              <div style={{
                marginBottom: '1rem', padding: '0.75rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-error)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Previous Rejection Reason
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {selectedDriver.kyc.rejectionReason}
                </p>
              </div>
            )}

            {/* Actions (only for pending) */}
            {selectedDriver.kyc?.status === 'pending' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Rejection reason <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(required to reject)</span></label>
                  <textarea
                    className="input" style={{ resize: 'none' }} rows={2}
                    placeholder="e.g. License image is blurry, please re-upload"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-reject" style={{ flex: 1, gap: '0.35rem' }}
                    onClick={() => handleDecision(selectedDriver._id, 'rejected')}
                    disabled={!!processing || !rejectionReason}>
                    <IconClose />
                    {processing === selectedDriver._id + 'rejected' ? '...' : 'Reject'}
                  </button>
                  <button className="btn btn-approve" style={{ flex: 1, gap: '0.35rem' }}
                    onClick={() => handleDecision(selectedDriver._id, 'verified')}
                    disabled={!!processing}>
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
