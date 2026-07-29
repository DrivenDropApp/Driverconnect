import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';

type KycStep = 'photo' | 'license' | 'aadhaar' | 'bank';

export default function KycPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<KycStep>('photo');
  const [urls, setUrls] = useState({ photoUrl: '', licenseUrl: '', aadhaarUrl: '' });
  const [bankDetails, setBankDetails] = useState({ accountNo: '', ifsc: '' });
  const [submitting, setSubmitting] = useState(false);

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
  const steps = [
    { id: 'photo', icon: '🤳', label: 'Profile Photo', done: !!urls.photoUrl },
    { id: 'license', icon: '🪪', label: 'Driving License', done: !!urls.licenseUrl },
    { id: 'aadhaar', icon: '🆔', label: 'Aadhaar Card', done: !!urls.aadhaarUrl },
    { id: 'bank', icon: '🏦', label: 'Bank Details', done: !!bankDetails.accountNo },
  ];

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>
      <nav className="navbar">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '0.25rem' }}>← Back</button>
        <span style={{ fontWeight: 700 }}>KYC Verification</span>
        <div style={{ width: '60px' }} />
      </nav>

      <div style={{ padding: '1.5rem' }}>
        {/* Status Banner */}
        <div style={{
          background: kycStatus === 'verified' ? 'rgba(16,185,129,0.1)' :
            kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${kycStatus === 'verified' ? 'rgba(16,185,129,0.3)' : kycStatus === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.75rem' }}>{kycStatus === 'verified' ? '✅' : kycStatus === 'rejected' ? '❌' : '⏳'}</span>
          <div>
            <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
              {kycStatus === 'verified' ? 'KYC Verified!' : kycStatus === 'rejected' ? 'KYC Rejected' : 'KYC Under Review'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              {kycStatus === 'verified' ? 'You can accept rides now' :
               kycStatus === 'rejected' ? `Reason: ${profile?.kyc?.rejectionReason || 'Documents not valid'}` :
               'Usually takes 1-2 business days'}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id as KycStep)}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: activeStep === step.id ? 'rgba(13,148,136,0.2)' : 'var(--color-surface-2)',
                borderBottom: `2px solid ${step.done ? '#10B981' : activeStep === step.id ? '#0D9488' : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: '1.25rem' }}>{step.done ? '✅' : step.icon}</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>{step.label}</div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        {activeStep === 'photo' && (
          <div className="card animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>🤳 Profile Photo</h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              Upload a clear, recent headshot. This will be shown to customers.
            </p>
            {urls.photoUrl && (
              <img src={urls.photoUrl} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '2px solid #0D9488' }} />
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Photo URL (Cloudinary/CDN link)</label>
              <input
                className="input"
                placeholder="https://..."
                value={urls.photoUrl}
                onChange={e => setUrls(u => ({ ...u, photoUrl: e.target.value }))}
              />
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                In production, tap "Upload Photo" to upload from camera/gallery
              </p>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setActiveStep('license')}>Continue →</button>
          </div>
        )}

        {activeStep === 'license' && (
          <div className="card animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>🪪 Driving License</h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              Upload front and back of your valid driving license.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>License Document URL</label>
              <input className="input" placeholder="https://..." value={urls.licenseUrl} onChange={e => setUrls(u => ({ ...u, licenseUrl: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setActiveStep('aadhaar')}>Continue →</button>
          </div>
        )}

        {activeStep === 'aadhaar' && (
          <div className="card animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>🆔 Aadhaar Card</h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              Upload a clear photo of your Aadhaar card.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Aadhaar Document URL</label>
              <input className="input" placeholder="https://..." value={urls.aadhaarUrl} onChange={e => setUrls(u => ({ ...u, aadhaarUrl: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleSubmitKyc} disabled={submitting}>
              {submitting ? 'Submitting...' : '📤 Submit KYC for Review'}
            </button>
          </div>
        )}

        {activeStep === 'bank' && (
          <div className="card animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>🏦 Bank Details</h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              For earnings payouts. All details are encrypted.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Account Number</label>
                <input className="input" placeholder="Enter account number" value={bankDetails.accountNo} onChange={e => setBankDetails(b => ({ ...b, accountNo: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>IFSC Code</label>
                <input className="input" placeholder="IFSC code (e.g. SBIN0001234)" value={bankDetails.ifsc} onChange={e => setBankDetails(b => ({ ...b, ifsc: e.target.value.toUpperCase() }))} maxLength={11} />
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleSaveBankDetails} disabled={submitting}>
              {submitting ? 'Saving...' : '💾 Save Bank Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
