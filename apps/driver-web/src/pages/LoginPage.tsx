import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';

const LANGUAGES = ['Hindi', 'Marathi', 'English', 'Urdu', 'Gujarati', 'Telugu', 'Tamil', 'Kannada'];

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function IconCar() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75"
      style={{ width: 30, height: 30 }}>
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
      style={{ width: 14, height: 14 }}>
      <rect x="4" y="1" width="8" height="14" rx="2" />
      <circle cx="8" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Shared Styles ───────────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.875rem',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--color-text-primary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(255,255,255,0.1)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.055em',
  marginBottom: '0.35rem',
};

const sectionBoxStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 'var(--radius-lg)',
  padding: '0.875rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, updateDriver } = useDriverAuthStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Temp storage for new-user tokens (don't set isAuthenticated until profile done)
  const pendingAuthRef = useRef<{ driver: any; accessToken: string; refreshToken: string } | null>(null);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('male');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

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
      if (res.isNewUser) {
        // Don't call setAuth yet — that would flip isAuthenticated and cause
        // PublicRoute to immediately redirect away before the form is filled.
        // Store tokens temporarily and show the profile form.
        pendingAuthRef.current = {
          driver: res.driver,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        };
        setStep('profile');
        setTimeout(() => firstNameRef.current?.focus(), 100);
      } else {
        setAuth(res.driver, res.accessToken, res.refreshToken);
        const displayName = res.driver?.name && res.driver.name !== '__pending__'
          ? res.driver.name
          : 'Driver';
        toast.success(`Welcome back, ${displayName}!`);
        navigate('/');
      }
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

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleCompleteProfile = async () => {
    if (!firstName.trim()) { toast.error('Enter your first name'); return; }
    if (!lastName.trim()) { toast.error('Enter your last name'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email'); return; }
    if (alternatePhone && alternatePhone.replace(/\D/g, '').length !== 10) {
      toast.error('Alternate phone must be 10 digits'); return;
    }
    if (!pendingAuthRef.current) {
      toast.error('Session expired. Please log in again.');
      setStep('phone');
      return;
    }
    setLoading(true);
    try {
      // First authenticate so the API call has a valid token
      const { driver: pendingDriver, accessToken, refreshToken } = pendingAuthRef.current;
      setAuth(pendingDriver, accessToken, refreshToken);

      const res: any = await driverApi.completeDriverProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        alternatePhone: alternatePhone.trim() || undefined,
        languages: selectedLanguages.length ? selectedLanguages : undefined,
      });
      updateDriver(res.driver);
      toast.success(`Welcome, ${res.driver.name}! Your profile is submitted for KYC review. 🎉`);
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
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(5,150,105,0.2) 0%, var(--color-bg) 65%)',
      padding: '1.25rem 1rem',
    }}>

      {/* ── Brand Mark ─────────────────────────────────── */}
      <div className="animate-fade-in" style={{
        textAlign: 'center',
        marginBottom: step === 'profile' ? '1rem' : '1.5rem',
        marginTop: step === 'profile' ? '0.75rem' : '2.5rem',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          width: step === 'profile' ? 48 : 64,
          height: step === 'profile' ? 48 : 64,
          borderRadius: step === 'profile' ? 'var(--radius-lg)' : 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
          marginBottom: step === 'profile' ? '0' : '0.75rem',
          color: 'white',
          boxShadow: '0 0 36px rgba(5,150,105,0.4), 0 6px 24px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
          flexShrink: 0,
        }}>
          <IconCar />
        </div>
        {step !== 'profile' && (
          <div style={{ marginTop: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 3, letterSpacing: '-0.025em' }}>Driver Portal</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
              DriverConnect &mdash; Drive &amp; Earn
            </p>
          </div>
        )}
      </div>

      {/* ── Card ───────────────────────────────────────── */}
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(160deg, rgba(19,30,48,0.97) 0%, rgba(10,18,35,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.07) inset',
          padding: 'clamp(1.25rem, 5vw, 1.75rem)',
          boxSizing: 'border-box',
        }}
      >

        {/* ── Step 1: Phone ──────────────────────────────── */}
        {step === 'phone' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Sign in</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Enter your registered phone number
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '1rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
                  borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '0.625rem',
                  pointerEvents: 'none',
                }}>
                  <IconPhone /> +91
                </span>
                <input
                  className="input" type="tel" placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendOtp()}
                  style={{ paddingLeft: '4.75rem', height: '3rem', fontSize: '1rem', letterSpacing: '0.03em' }}
                  autoFocus
                />
              </div>
            </div>

            <button className="btn btn-online btn-full btn-lg" onClick={handleSendOtp}
              disabled={loading || phone.length < 10} style={{ gap: '0.5rem', height: '3rem' }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <IconArrowRight />}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '0.75rem', color: 'var(--color-text-disabled)' }}>
              A 4-digit OTP will be sent via SMS
            </p>
          </div>
        )}

        {/* ── Step 2: OTP ────────────────────────────────── */}
        {step === 'otp' && (
          <div>
            <button className="btn btn-ghost"
              onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
              style={{ padding: '0.2rem 0', gap: 4, marginBottom: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
              <IconChevronLeft /> Back
            </button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>Verify OTP</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Sent to{' '}
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>+91 {phone}</span>
            </p>

            {devOtp && (
              <div style={{
                marginBottom: '1.25rem', padding: '0.7rem 1rem',
                background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-warning)', fontWeight: 600, margin: 0 }}>
                  Dev OTP: <span style={{ fontSize: '1.05rem', letterSpacing: 6 }}>{devOtp}</span>
                </p>
              </div>
            )}

            <div className="otp-input-group" style={{ marginBottom: '1.75rem', justifyContent: 'center' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" className="otp-digit"
                  value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
                  }}
                  maxLength={1} />
              ))}
            </div>

            <button className="btn btn-online btn-full btn-lg"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.join('').length < 4}
              style={{ height: '3rem' }}>
              {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {/* ── Step 3: Driver Info (new users) ────────────── */}
        {step === 'profile' && (
          <div>
            {/* Step pills */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.1rem' }}>
              {['Phone', 'OTP', 'Profile'].map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i === 2 ? 1 : '0 0 auto' }}>
                  <div style={{
                    padding: '0.18rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.63rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: i === 2 ? 'var(--color-online)' : 'rgba(255,255,255,0.06)',
                    color: i === 2 ? 'white' : 'var(--color-text-disabled)',
                    border: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'nowrap',
                  }}>{label}</div>
                  {i < 2 && (
                    <div style={{
                      flex: 1, height: 1, minWidth: 12, margin: '0 0.3rem',
                      background: 'rgba(255,255,255,0.1)',
                    }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>Complete Your Profile</h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Required fields marked <span style={{ color: '#EF4444' }}>*</span>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ── Required section ── */}
              <div style={sectionBoxStyle}>
                {/* Name row: flex-wrap so it stacks on very narrow mobile screens */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 105px', minWidth: 0 }}>
                    <label style={labelStyle}>First Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input ref={firstNameRef} style={inputStyle} type="text"
                      placeholder="Rahul" value={firstName}
                      onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                  </div>
                  <div style={{ flex: '1 1 105px', minWidth: 0 }}>
                    <label style={labelStyle}>Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input style={inputStyle} type="text"
                      placeholder="Patil" value={lastName}
                      onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label style={labelStyle}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                  <select style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    appearance: 'none' as any,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.875rem center',
                    paddingRight: '2.25rem',
                  }}
                    value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* ── Optional section ── */}
              <div style={sectionBoxStyle}>
                <p style={{
                  fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0,
                }}>Optional Details</p>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email"
                    placeholder="rahul@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>

                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
                    value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} />
                </div>

                <div>
                  <label style={labelStyle}>Alternate Phone</label>
                  <input style={inputStyle} type="tel"
                    placeholder="Alternate number" value={alternatePhone}
                    onChange={e => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </div>
              </div>

              {/* ── Languages ── */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Languages Known</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {LANGUAGES.map(lang => {
                    const selected = selectedLanguages.includes(lang);
                    return (
                      <button key={lang} type="button"
                        onClick={() => toggleLanguage(lang)}
                        style={{
                          padding: '0.375rem 0.875rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-full)',
                          border: `1.5px solid ${selected ? 'var(--color-online)' : 'rgba(255,255,255,0.1)'}`,
                          background: selected ? 'rgba(5,150,105,0.14)' : 'transparent',
                          color: selected ? 'var(--color-online-light)' : 'var(--color-text-secondary)',
                          fontWeight: selected ? 600 : 400,
                          transition: 'all 0.15s',
                          lineHeight: 1.5,
                          boxShadow: selected ? '0 0 10px rgba(5,150,105,0.18)' : 'none',
                        }}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Submit ── */}
              <button className="btn btn-online btn-full btn-lg"
                onClick={handleCompleteProfile}
                disabled={loading || !firstName.trim() || !lastName.trim()}
                style={{ gap: '0.5rem', marginTop: '0.25rem', height: '3rem' }}>
                {loading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <IconArrowRight />}
                {loading ? 'Saving...' : 'Complete Registration'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--color-text-disabled)', margin: 0 }}>
                KYC document upload is the next step
              </p>
            </div>
          </div>
        )}
      </div>

      <p style={{ margin: '1.25rem 0 1.5rem', fontSize: '0.74rem', color: 'var(--color-text-disabled)', textAlign: 'center' }}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </p>
    </div>
  );
}
