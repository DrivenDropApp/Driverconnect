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

/* ── Shared Input Style ────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.875rem',
  background: 'var(--color-surface-2)',
  color: 'var(--color-text-primary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
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
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: 'var(--sp-6)', background: 'var(--color-bg)',
      overflowY: 'auto',
    }}>
      {/* Brand Mark */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 'var(--sp-6)', marginTop: 'var(--sp-8)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius-xl)',
          background: 'var(--color-online)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--sp-4)', color: 'white',
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
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 'var(--sp-7)' }}>

        {/* ── Step 1: Phone ──────────────────────────────── */}
        {step === 'phone' && (
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
                  color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
                }}>
                  <IconPhone /> +91
                </span>
                <input
                  className="input" type="tel" placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendOtp()}
                  style={{ paddingLeft: '4rem' }}
                  autoFocus
                />
              </div>
            </div>

            <button className="btn btn-online btn-full btn-lg" onClick={handleSendOtp}
              disabled={loading || phone.length < 10} style={{ gap: 'var(--sp-2)' }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <IconArrowRight />}
            </button>
          </div>
        )}

        {/* ── Step 2: OTP ────────────────────────────────── */}
        {step === 'otp' && (
          <div>
            <button className="btn btn-ghost"
              onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
              style={{ padding: 0, gap: 4, marginBottom: 'var(--sp-5)', color: 'var(--color-text-secondary)' }}>
              <IconChevronLeft /> Back
            </button>

            <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Enter OTP</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-6)' }}>
              Sent to +91 {phone}
            </p>

            {devOtp && (
              <div style={{
                marginBottom: 'var(--sp-5)', padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600, margin: 0 }}>
                  Dev OTP: <span style={{ fontSize: '1.1rem', letterSpacing: 4 }}>{devOtp}</span>
                </p>
              </div>
            )}

            <div className="otp-input-group" style={{ marginBottom: 'var(--sp-8)' }}>
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
              disabled={loading || otp.join('').length < 4}>
              {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {/* ── Step 3: Driver Info (new users) ────────────── */}
        {step === 'profile' && (
          <div>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: 'var(--color-online)',
                  opacity: i === 2 ? 1 : 0.35,
                }} />
              ))}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' }}>Driver Info</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Please enter your information
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* First + Last Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>First Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input ref={firstNameRef} style={inputStyle} type="text"
                    placeholder="Rahul" value={firstName}
                    onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input style={inputStyle} type="text"
                    placeholder="Patil" value={lastName}
                    onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={{ ...inputStyle, cursor: 'pointer' }}
                  value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>
                  Email <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="email"
                  placeholder="rahul@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>
                  Date of Birth <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="date"
                  value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} />
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem' }}>
                  Alternate Phone <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="tel"
                  placeholder="Enter alternate phone number" value={alternatePhone}
                  onChange={e => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </div>

              {/* Languages */}
              <div>
                <label className="input-label" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', display: 'block' }}>
                  Languages Known
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {LANGUAGES.map(lang => {
                    const selected = selectedLanguages.includes(lang);
                    return (
                      <button key={lang} type="button"
                        onClick={() => toggleLanguage(lang)}
                        style={{
                          padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer',
                          borderRadius: 'var(--radius-full)',
                          border: `1px solid ${selected ? 'var(--color-online)' : 'var(--color-border)'}`,
                          background: selected ? 'var(--color-online)' : 'var(--color-surface-2)',
                          color: selected ? 'white' : 'var(--color-text-secondary)',
                          fontWeight: selected ? 600 : 400,
                          transition: 'all 0.15s',
                        }}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button className="btn btn-online btn-full btn-lg"
                onClick={handleCompleteProfile}
                disabled={loading || !firstName.trim() || !lastName.trim()}
                style={{ gap: 'var(--sp-2)', marginTop: '0.25rem' }}>
                {loading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <IconArrowRight />}
                {loading ? 'Saving...' : 'Next'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-disabled)', marginTop: '0.25rem' }}>
                You'll complete KYC document upload after this step
              </p>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: 'var(--sp-5)', fontSize: '0.78rem', color: 'var(--color-text-disabled)', textAlign: 'center' }}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </p>
    </div>
  );
}
