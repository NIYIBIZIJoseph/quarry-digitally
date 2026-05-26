import { useState } from 'react';
import { useRouter } from 'next/router';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = router.query;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || typeof phone !== 'string') return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      if (data.requiresRegistration) {
        router.push(`/register?phone=${phone}`);
        return;
      }

      // ✅ Save token and user info
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect based on forceReset flag
        if (data.user.forceReset) {
          router.push('/reset-password');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('No token received. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleVerify} className="bg-white p-6 rounded shadow-md w-96">
        <h1 className="text-xl font-bold mb-4">Enter OTP</h1>
        <p className="mb-2 text-gray-600">OTP sent to {phone}</p>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit code"
          className="w-full p-2 border rounded mb-4"
          required
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Verifying...' : 'Verify & Login'}
        </button>
      </form>
    </div>
  );
}