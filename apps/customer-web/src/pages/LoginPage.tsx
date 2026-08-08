import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

function IconCar() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 32, height: 32 }}>
      <path d="M6 20l3-9h14l3 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="20" width="26" height="8" rx="3" stroke="white" strokeWidth="2" />
      <circle cx="9" cy="28" r="2.5" fill="white" />
      <circle cx="23" cy="28" r="2.5" fill="white" />
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

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 22, height: 22, color: 'var(--color-primary)' }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, updateUser } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string>('');

  // Profile step state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Temporarily store tokens for new user before profile is saved
  const pendingAuth = useRef<{ user: any; accessToken: string; refreshToken: string } | null>(null);

  const handleSendOtp = async () => {
    if (phone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
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

  const proceedAfterOtp = async (otpStr: string) => {
    setLoading(true);
    try {
      const res: any = await api.login(phone, otpStr);

      if (res.isNewUser) {
        // Store tokens temporarily, show profile completion step
        pendingAuth.current = { user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken };
        // Set auth so the completeProfile API call can use the token
        setAuth(res.user, res.accessToken, res.refreshToken);
        setStep('profile');
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        setAuth(res.user, res.accessToken, res.refreshToken);
        toast.success(`Welcome back, ${res.user?.name || 'there'}!`);
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const otpStr = otp.join('');
    if (otpStr.length < 4) { toast.error('Enter the 4-digit OTP'); return; }
    proceedAfterOtp(otpStr);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d) && newOtp.join('').length === 4) {
      setTimeout(() => proceedAfterOtp(newOtp.join('')), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCompleteProfile = async () => {
    if (fullName.trim().length < 2) { toast.error('Please enter your full name (at least 2 characters)'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      const res: any = await api.completeProfile(fullName.trim(), email.trim());
      updateUser(res.user);
      toast.success(`Welcome to DriverConnect, ${res.user.name}! 🎉`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  return (
    <div className="page" style={{
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', position: 'relative', overflow: 'hidden',
      padding: '2rem',
    }}>
      {/* Subtle bg glow */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-15%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-20%',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="login-journey" aria-hidden="true">
        <span className="login-journey-road" />
        <span className="login-journey-car">●</span>
        <span className="login-journey-dot login-journey-dot-one" />
        <span className="login-journey-dot login-journey-dot-two" />
      </div>
      <div style={{ width: '100%', maxWidth: 400, zIndex: 1 }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 1rem',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(13,148,136,0.35)',
          }}>
            <IconCar />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            DriverConnect
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            Professional drivers for your car
          </p>
        </div>

        {/* Card */}
        <div className="card">

          {/* ── Step 1: Phone ─────────────────────────────── */}
          {step === 'phone' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>Welcome</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '0.875rem' }}>
                Enter your phone number to continue
              </p>

              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)', fontSize: '0.9rem', pointerEvents: 'none',
                    fontWeight: 500,
                  }}>+91</span>
                  <input
                    type="tel"
                    className="input"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendOtp()}
                    style={{ paddingLeft: 46 }}
                    autoFocus
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                style={{ gap: '0.5rem' }}
              >
                {loading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <IconArrowRight />}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>

              <div style={{
                marginTop: '1.25rem', padding: '0.75rem',
                background: 'var(--color-primary-subtle)',
                border: '1px solid rgba(13,148,136,0.18)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Dev mode — use any number. OTP shown in response.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: OTP ───────────────────────────────── */}
          {step === 'otp' && (
            <div>
              <button
                className="btn btn-ghost"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
                style={{ marginBottom: '1.5rem', padding: '0', gap: '0.3rem', fontSize: '0.875rem' }}
              >
                <IconChevronLeft />
                Back
              </button>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>Enter OTP</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Sent to +91 {phone}
              </p>

              {devOtp && (
                <div style={{
                  marginBottom: '1.25rem', padding: '0.625rem 0.875rem',
                  background: 'var(--color-warning-bg)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                    Dev OTP: <span style={{ fontSize: '1.1rem', letterSpacing: '0.1em' }}>{devOtp}</span>
                  </p>
                </div>
              )}

              <div className="otp-input-group" style={{ marginBottom: '1.75rem' }}>
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
                {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Did not receive it?{' '}
                <button
                  className="btn btn-ghost"
                  style={{ padding: 0, fontSize: '0.82rem', color: 'var(--color-primary)' }}
                  onClick={() => setStep('phone')}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {/* ── Step 3: Profile (new users only) ─────────── */}
          {step === 'profile' && (
            <div>
              {/* Progress indicator */}
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
                {['phone', 'otp', 'profile'].map((s, i) => (
                  <div key={s} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= 2 ? 'var(--color-primary)' : 'var(--color-border)',
                    opacity: i === 2 ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                  }} />
                ))}
              </div>

              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--color-primary-subtle)',
                border: '1px solid rgba(13,148,136,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <IconUser />
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Complete your profile</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '0.875rem' }}>
                Just one more step — tell us your name to get started
              </p>

              {/* Full Name */}
              <div className="input-group" style={{ marginBottom: '1.125rem' }}>
                <label className="input-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  ref={nameInputRef}
                  type="text"
                  className="input"
                  placeholder="e.g. Rahul Patil"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleCompleteProfile()}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="input-group" style={{ marginBottom: '1.75rem' }}>
                <label className="input-label">
                  Email Address{' '}
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. rahul@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleCompleteProfile()}
                  autoComplete="email"
                />
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleCompleteProfile}
                disabled={loading || fullName.trim().length < 2}
                style={{ gap: '0.5rem' }}
              >
                {loading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <IconArrowRight />}
                {loading ? 'Saving...' : 'Get Started →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
                You can update these details later in your profile
              </p>
            </div>
          )}
        </div>

        <p style={{ marginTop: '1.5rem', color: 'var(--color-text-disabled)', fontSize: '0.75rem', textAlign: 'center' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
