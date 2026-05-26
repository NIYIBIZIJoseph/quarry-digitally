import { useState } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLock, faShieldAlt, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('login') + ' ' + t('failed'));
      
      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setUserId(data.userId);
        setStep('2fa');
        setLoading(false);
        return;
      }
      
      const userToStore = {
        ...data.user,
        fullName: data.user.fullName || data.user.full_name || phone,
      };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('verificationFailed'));
      const userToStore = {
        ...data.user,
        fullName: data.user.fullName || data.user.full_name || phone,
      };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0f2b3d 0%, #1a4a6e 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column', 
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: 0,
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
            <path d="M40 160 L80 80 L120 120 L160 40 L180 80 L140 160 Z" stroke="#f59e0b" strokeWidth="3" fill="none"/>
            <circle cx="100" cy="100" r="30" stroke="#f59e0b" strokeWidth="2" fill="none"/>
            <text x="100" y="180" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">HENG YUN</text>
            <text x="100" y="200" textAnchor="middle" fill="#cbd5e1" fontSize="14">Quarry ERP System</text>
          </svg>
          
          <h2 style={{ color: 'white', marginTop: '2rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {t('enterpriseResourcePlanning')}
          </h2>
          
          <p style={{ color: '#cbd5e1', textAlign: 'center', maxWidth: '300px', marginTop: '1rem', lineHeight: '1.6' }}>
            {t('loginPageDescription')}
          </p>
        </div>
      </div>

      {/* Right side – login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>{t('welcomeBack')}</h1>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>{t('signin')}</p>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('phone')}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faPhone} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }} 
                    placeholder="0788324580" 
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('password')}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faLock} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }} 
                    placeholder="••••••••" 
                  />
                </div>
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#f59e0b', color: '#1f2937', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? t('signingIn') : t('login')} {!loading && <FontAwesomeIcon icon={faArrowRight} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2faSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('otpCode')}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.5rem' }}>
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input 
                    type="text" 
                    value={code} 
                    onChange={e => setCode(e.target.value)} 
                    required 
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }} 
                    placeholder="000000" 
                    maxLength={6} 
                    autoFocus 
                  />
                </div>
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#f59e0b', color: '#1f2937', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? t('verifying') : t('verifyLogin')}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setTempToken(''); setUserId(null); setCode(''); }} style={{ marginTop: '1rem', width: '100%', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>
                {t('back')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}