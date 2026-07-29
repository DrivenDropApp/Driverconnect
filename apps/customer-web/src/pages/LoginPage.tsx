import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.sendOtp(phone);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        toast.success(`Dev OTP: ${res.devOtp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your phone');
      }
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 4) {
      toast.error('Enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.login(phone, otpStr);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.user?.name || 'there'}! 👋`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(d => d) && newOtp.join('').length === 4) {
      // Auto-submit when all digits filled
      setTimeout(() => handleVerifyOtpWithValue(newOtp.join('')), 100);
    }
  };

  const handleVerifyOtpWithValue = async (otpStr: string) => {
    setLoading(true);
    try {
      const res: any = await api.login(phone, otpStr);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.user?.name || 'there'}! 👋`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  return (
    <div className="page" style={{ background: 'linear-gradient(135deg, #060B18 0%, #0F1D35 50%, #060B18 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-20%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-20%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(13,148,136,0.4)',
          }}>
            <span style={{ fontSize: '2.5rem' }}>🚗</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#F1F5F9' }}>
            DriverConnect
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Professional drivers for your car
          </p>
        </div>

        {/* Card */}
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          {step === 'phone' ? (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome back 👋</h2>
              <p style={{ color: '#94A3B8', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Enter your phone number to continue
              </p>

              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    color: '#94A3B8', fontSize: '0.9rem', pointerEvents: 'none',
                  }}>+91</span>
                  <input
                    type="tel"
                    className="input"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    style={{ paddingLeft: '48px' }}
                    autoFocus
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
              >
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : null}
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(13,148,136,0.05)', borderRadius: '12px', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
                  🔐 Dev mode: Use any phone number<br />OTP will be shown in the response
                </p>
              </div>
            </div>
          ) : (
            <div>
              <button
                className="btn btn-ghost"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
                style={{ marginBottom: '1.5rem', padding: '0.25rem 0' }}
              >
                ← Back
              </button>

              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Enter OTP</h2>
              <p style={{ color: '#94A3B8', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Sent to +91 {phone}
              </p>

              {devOtp && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>
                    🔑 Dev OTP: <span style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>{devOtp}</span>
                  </p>
                </div>
              )}

              <div className="otp-input-group" style={{ marginBottom: '2rem' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    className="otp-digit"
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length < 4}
              >
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : null}
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748B' }}>
                Didn't receive?{' '}
                <button className="btn btn-ghost" style={{ padding: '0', fontSize: '0.85rem', color: '#0D9488' }} onClick={() => { setStep('phone'); }}>
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>

        <p style={{ marginTop: '2rem', color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
