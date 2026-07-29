import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { driverApi } from '../lib/api';
import { useDriverAuthStore } from '../store/authStore';

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
      if (res.devOtp) { setDevOtp(res.devOtp); toast.success(`Dev OTP: ${res.devOtp}`, { duration: 10000 }); }
      else toast.success('OTP sent to your phone');
      setStep('otp');
    } catch (err: any) { toast.error(err.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (otpStr?: string) => {
    const code = otpStr || otp.join('');
    if (code.length < 4) { toast.error('Enter the 4-digit OTP'); return; }
    setLoading(true);
    try {
      const res: any = await driverApi.login(phone, code);
      setAuth(res.driver, res.accessToken, res.refreshToken);
      toast.success(`Welcome, ${res.driver?.name}! 🚗`);
      navigate('/');
    } catch (err: any) { toast.error(err.message || 'Invalid OTP'); }
    finally { setLoading(false); }
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
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
      background: 'linear-gradient(135deg, #060B18 0%, #0A1628 50%, #060B18 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 1 }} className="animate-fade-in">
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, #059669, #047857)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          boxShadow: '0 0 32px rgba(5,150,105,0.4)',
        }}>🚗</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Driver Portal</h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>DriverConnect — Drive & Earn</p>
      </div>

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', zIndex: 1 }}>
        {step === 'phone' ? (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Driver Login</h2>
            <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Enter your registered phone number</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.875rem' }}>+91</span>
                <input
                  className="input"
                  type="tel" placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  style={{ paddingLeft: '48px' }}
                  autoFocus
                />
              </div>
            </div>
            <button className="btn btn-online btn-full btn-lg" onClick={handleSendOtp} disabled={loading || phone.length < 10}>
              {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : null}
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
          </div>
        ) : (
          <div>
            <button className="btn btn-ghost" onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }} style={{ marginBottom: '1.5rem', padding: '0' }}>← Back</button>
            <h2 style={{ marginBottom: '0.5rem' }}>Enter OTP</h2>
            <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Sent to +91 {phone}</p>
            {devOtp && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>🔑 Dev OTP: <span style={{ fontSize: '1.2rem' }}>{devOtp}</span></p>
              </div>
            )}
            <div className="otp-input-group" style={{ marginBottom: '2rem' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" className="otp-digit" value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => e.key === 'Backspace' && !otp[i] && i > 0 && inputRefs.current[i-1]?.focus()}
                  maxLength={1} />
              ))}
            </div>
            <button className="btn btn-online btn-full btn-lg" onClick={() => handleVerifyOtp()} disabled={loading || otp.join('').length < 4}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
