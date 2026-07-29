import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconCar() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75"
      style={{ width: 32, height: 32 }}>
      <path d="M6 19l2.5-7h15L26 19" strokeLinecap="round" />
      <rect x="3" y="19" width="26" height="8" rx="3" />
      <circle cx="8.5" cy="27" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="23.5" cy="27" r="2.5" fill="currentColor" stroke="none" />
      <path d="M3 22h26" strokeLinecap="round" />
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

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ width: 16, height: 16 }}>
      <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
      style={{ width: 15, height: 15 }}>
      <rect x="4" y="1" width="8" height="14" rx="2" />
      <circle cx="8" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useDriverAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      const res: any = await driverApi.sendOtp(phone);
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

  const handleVerifyOtp = async (otpStr?: string) => {
    const code = otpStr || otp.join('');
    if (code.length < 4) { toast.error('Enter the 4-digit OTP'); return; }
    setLoading(true);
    try {
      const res: any = await driverApi.login(phone, code);
      setAuth(res.driver, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.driver?.name}!`);
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
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d) && newOtp.join('').length === 4) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
    }
  };

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-6)',
      background: 'var(--color-bg)',
    }}>
      {/* Brand Mark */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-online)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--sp-5)',
          color: 'white',
          boxShadow: '0 0 28px var(--color-online-glow)',
        }}>
          <IconCar />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Driver Portal</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          DriverConnect &mdash; Drive &amp; Earn
        </p>
      </div>

      {/* Card */}
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 400, padding: 'var(--sp-8)' }}>
        {step === 'phone' ? (
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Sign in</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-6)' }}>
              Enter your registered phone number
            </p>

            <div className="input-group" style={{ marginBottom: 'var(--sp-6)' }}>
              <label className="input-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 'var(--sp-4)', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  userSelect: 'none',
                }}>
                  <IconPhone />
                  +91
                </span>
                <input
                  className="input"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendOtp()}
                  style={{ paddingLeft: '4rem' }}
                  autoFocus
                />
              </div>
            </div>

            <button
              className="btn btn-online btn-full btn-lg"
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              style={{ gap: 'var(--sp-2)' }}
            >
              {loading
                ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : null}
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <IconArrowRight />}
            </button>
          </div>
        ) : (
          <div>
            <button
              className="btn btn-ghost"
              onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
              style={{ padding: 0, gap: 4, marginBottom: 'var(--sp-5)', color: 'var(--color-text-secondary)' }}
            >
              <IconChevronLeft />
              Back
            </button>

            <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Enter OTP</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-6)' }}>
              Sent to +91 {phone}
            </p>

            {devOtp && (
              <div style={{
                marginBottom: 'var(--sp-5)',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600, margin: 0 }}>
                  Dev OTP: <span style={{ fontSize: '1.1rem', letterSpacing: 4 }}>{devOtp}</span>
                </p>
              </div>
            )}

            <div className="otp-input-group" style={{ marginBottom: 'var(--sp-8)' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  className="otp-digit"
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
                  }}
                  maxLength={1}
                />
              ))}
            </div>

            <button
              className="btn btn-online btn-full btn-lg"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.join('').length < 4}
            >
              {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 'var(--sp-6)', fontSize: '0.78rem', color: 'var(--color-text-disabled)', textAlign: 'center' }}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </p>
    </div>
  );
}
