import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ width: 15, height: 15 }}>
      <path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheckFilled() {
  return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 18, height: 18 }}>
      <circle cx="8" cy="8" r="8" fill="#10B981" />
      <path d="M4.5 8l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <circle cx="10" cy="11" r="3" />
      <path d="M7 5V4a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
    </svg>
  );
}

function IconId() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <circle cx="7" cy="11" r="2" />
      <path d="M11 9h4M11 12h3" strokeLinecap="round" />
    </svg>
  );
}

function IconFingerprint() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <path d="M10 2a8 8 0 00-5.6 13.6M10 2a8 8 0 015.6 13.6" strokeLinecap="round" />
      <path d="M10 5a5 5 0 00-4.3 7.5M10 5a5 5 0 014.3 7.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}

function IconBank() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <path d="M2 8l8-5 8 5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="8" width="16" height="2" rx="1" />
      <path d="M4 10v5M8 10v5M12 10v5M16 10v5" strokeLinecap="round" />
      <rect x="2" y="15" width="16" height="2" rx="1" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <path d="M10 2L3 5v5c0 4 3.2 7.5 7 8.5C16.8 17.5 17 13 17 10V5l-7-3z" />
      <path d="M7 10l2.5 2.5L13 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      style={{ width: 20, height: 20 }}>
      <circle cx="10" cy="10" r="8" />
      <path d="M10 5v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"
      style={{ width: 20, height: 20 }}>
      <circle cx="10" cy="10" r="8" />
      <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 15, height: 15 }}>
      <path d="M14 2L2 7l5 3 7-8zM7 10l1 4 2-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 15, height: 15 }}>
      <path d="M13 13H3a1 1 0 01-1-1V4l3-3h7a1 1 0 011 1v10a1 1 0 01-1 1z" />
      <path d="M5 1v4h6V1M5 13v-4h6v4" strokeLinecap="round" />
    </svg>
  );
}

type KycStep = 'photo' | 'license' | 'aadhaar' | 'bank';

export default function KycPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<KycStep>('photo');
  const [urls, setUrls] = useState({ photoUrl: '', licenseUrl: '', aadhaarUrl: '' });
  const [bankDetails, setBankDetails] = useState({ accountNo: '', ifsc: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, license: false, aadhaar: false });

  const handleFileUpload = async (type: 'photo' | 'license' | 'aadhaar', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(u => ({ ...u, [type]: true }));
    try {
      const { signature, timestamp, apiKey, cloudName }: any = await driverApi.getUploadSignature();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setUrls(u => ({ ...u, [`${type}Url`]: data.secure_url }));
      toast.success('File uploaded successfully');
    } catch (err: any) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(u => ({ ...u, [type]: false }));
    }
  };

  useEffect(() => {
    driverApi.getProfile().then((p: any) => {
      setProfile(p);
      setUrls({
        photoUrl: p.kyc?.photoUrl || '',
        licenseUrl: p.kyc?.licenseUrl || '',
        aadhaarUrl: p.kyc?.aadhaarUrl || '',
      });
      setBankDetails({
        accountNo: p.bankDetails?.accountNo || '',
        ifsc: p.bankDetails?.ifsc || '',
      });
    }).catch(() => {});
  }, []);

  const handleSubmitKyc = async () => {
    if (!urls.photoUrl || !urls.licenseUrl || !urls.aadhaarUrl) {
      toast.error('Please fill in all document URLs');
      return;
    }
    setSubmitting(true);
    try {
      await driverApi.updateKyc(urls);
      toast.success('KYC submitted! Under review.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.accountNo || !bankDetails.ifsc) {
      toast.error('Fill in all bank details');
      return;
    }
    setSubmitting(true);
    try {
      await driverApi.updateBankDetails(bankDetails);
      toast.success('Bank details saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const kycStatus = profile?.kyc?.status;

  const steps: { id: KycStep; label: string; shortLabel: string; icon: React.ReactNode; done: boolean }[] = [
    { id: 'photo',   label: 'Profile Photo',    shortLabel: 'Photo',   icon: <IconCamera />,      done: !!urls.photoUrl },
    { id: 'license', label: 'Driving License',  shortLabel: 'License', icon: <IconId />,          done: !!urls.licenseUrl },
    { id: 'aadhaar', label: 'Aadhaar Card',     shortLabel: 'Aadhaar', icon: <IconFingerprint />, done: !!urls.aadhaarUrl },
    { id: 'bank',    label: 'Bank Details',     shortLabel: 'Bank',    icon: <IconBank />,        done: !!bankDetails.accountNo },
  ];

  const statusConfig = {
    verified: { icon: <IconShield />,  color: 'var(--color-success)', label: 'KYC Verified', sub: 'You can accept rides now' },
    rejected: { icon: <IconX />,       color: 'var(--color-error)',   label: 'KYC Rejected',  sub: `Reason: ${profile?.kyc?.rejectionReason || 'Documents not valid'}` },
    pending:  { icon: <IconClock />,   color: 'var(--color-warning)', label: 'Under Review',  sub: 'Usually takes 1–2 business days' },
  };
  const sc = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="page" style={{ paddingBottom: 'var(--sp-8)' }}>
      <nav className="navbar">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ padding: '0.25rem', gap: 4 }}
        >
          <IconChevronLeft />
          Back
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>KYC Verification</span>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
        {/* Status Banner */}
        {kycStatus && (
          <div
            className={`kyc-banner ${kycStatus === 'verified' ? 'verified' : kycStatus === 'rejected' ? 'rejected' : 'pending'} animate-fade-in`}
            style={{ marginBottom: 'var(--sp-5)' }}
          >
            <span style={{ color: sc.color }}>{sc.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: sc.color, fontSize: '0.9rem' }}>{sc.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{sc.sub}</div>
            </div>
          </div>
        )}

        {/* Step Tabs */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`kyc-tab ${step.done ? 'done' : ''} ${activeStep === step.id && !step.done ? 'active' : ''}`}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 4,
                color: step.done
                  ? 'var(--color-success)'
                  : activeStep === step.id
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              }}>
                {step.done ? <IconCheckFilled /> : step.icon}
              </div>
              <div style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                color: step.done
                  ? 'var(--color-success)'
                  : activeStep === step.id
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              }}>
                {step.shortLabel}
              </div>
            </button>
          ))}
        </div>

        {/* Photo Step */}
        {activeStep === 'photo' && (
          <div className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'rgba(13,148,136,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <IconCamera />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>Profile Photo</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Clear, recent headshot
                </p>
              </div>
            </div>

            {urls.photoUrl && (
              <img
                src={urls.photoUrl}
                alt="Profile preview"
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  objectFit: 'cover', display: 'block',
                  marginBottom: 'var(--sp-4)',
                  border: '2px solid var(--color-primary)',
                }}
              />
            )}

            <div className="input-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="input-label">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={e => handleFileUpload('photo', e)}
                disabled={uploading.photo}
                style={{ padding: '0.5rem' }}
              />
              {uploading.photo && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-disabled)', marginTop: 3 }}>
                Tap to upload from camera or gallery
              </span>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => setActiveStep('license')}
              style={{ gap: 6 }}
            >
              Continue
              <IconArrowRight />
            </button>
          </div>
        )}

        {/* License Step */}
        {activeStep === 'license' && (
          <div className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'rgba(13,148,136,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <IconId />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>Driving License</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Front and back of valid license
                </p>
              </div>
            </div>

            {urls.licenseUrl && (
              <img
                src={urls.licenseUrl}
                alt="License preview"
                style={{
                  width: '100%', height: 160, borderRadius: 'var(--radius-md)',
                  objectFit: 'cover', display: 'block',
                  marginBottom: 'var(--sp-4)',
                  border: '1px solid var(--color-border)',
                }}
              />
            )}

            <div className="input-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="input-label">Upload License</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={e => handleFileUpload('license', e)}
                disabled={uploading.license}
                style={{ padding: '0.5rem' }}
              />
              {uploading.license && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => setActiveStep('aadhaar')}
              style={{ gap: 6 }}
            >
              Continue
              <IconArrowRight />
            </button>
          </div>
        )}

        {/* Aadhaar Step */}
        {activeStep === 'aadhaar' && (
          <div className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'rgba(13,148,136,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <IconFingerprint />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>Aadhaar Card</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Clear photo of your Aadhaar card
                </p>
              </div>
            </div>

            {urls.aadhaarUrl && (
              <img
                src={urls.aadhaarUrl}
                alt="Aadhaar preview"
                style={{
                  width: '100%', height: 160, borderRadius: 'var(--radius-md)',
                  objectFit: 'cover', display: 'block',
                  marginBottom: 'var(--sp-4)',
                  border: '1px solid var(--color-border)',
                }}
              />
            )}

            <div className="input-group" style={{ marginBottom: 'var(--sp-5)' }}>
              <label className="input-label">Upload Aadhaar Card</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={e => handleFileUpload('aadhaar', e)}
                disabled={uploading.aadhaar}
                style={{ padding: '0.5rem' }}
              />
              {uploading.aadhaar && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleSubmitKyc}
              disabled={submitting}
              style={{ gap: 6 }}
            >
              {submitting
                ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <IconSend />}
              {submitting ? 'Submitting...' : 'Submit KYC for Review'}
            </button>
          </div>
        )}

        {/* Bank Step */}
        {activeStep === 'bank' && (
          <div className="card animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'rgba(13,148,136,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <IconBank />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>Bank Details</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  For earnings payouts &mdash; encrypted &amp; secure
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
              <div className="input-group">
                <label className="input-label">Account Number</label>
                <input
                  className="input"
                  placeholder="Enter account number"
                  value={bankDetails.accountNo}
                  onChange={e => setBankDetails(b => ({ ...b, accountNo: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">IFSC Code</label>
                <input
                  className="input"
                  placeholder="e.g. SBIN0001234"
                  value={bankDetails.ifsc}
                  onChange={e => setBankDetails(b => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
                  maxLength={11}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleSaveBankDetails}
              disabled={submitting}
              style={{ gap: 6 }}
            >
              {submitting
                ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <IconSave />}
              {submitting ? 'Saving...' : 'Save Bank Details'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 'var(--sp-4)',
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--color-success-bg)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ color: 'var(--color-success)' }}><IconCheck /></span>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', margin: 0 }}>
                Bank details are encrypted and stored securely
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
