import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import {
  KIIT_ADMIN_CREDENTIALS,
  KIIT_ADMIN_AUTH_KEY,
} from '../config/kiitAdmin';

const UniversityAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KIIT_ADMIN_AUTH_KEY) === 'true') {
      navigate('/university/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate credentials first
      if (
        email !== KIIT_ADMIN_CREDENTIALS.email ||
        password !== KIIT_ADMIN_CREDENTIALS.password
      ) {
        setError('Invalid KIIT admin credentials.');
        setLoading(false);
        return;
      }

      // Send OTP to email
      const response = await fetch('/api/admin/university/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/university/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(KIIT_ADMIN_AUTH_KEY, 'true');
        navigate('/university/admin/dashboard');
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    setOtp('');

    try {
      const response = await fetch('/api/admin/university/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setError('');
        alert('OTP resent successfully!');
      } else {
        setError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setOtp('');
    setError('');
    setOtpSent(false);
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-blue-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="text-blue-400" size={28} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-400">OTP Verification</p>
              <h1 className="text-2xl font-semibold text-white">Verify Your Email</h1>
              <p className="text-slate-400 text-sm">
                OTP sent to {email}
              </p>
            </div>
          </div>
          {otpSent && (
            <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              OTP has been sent to your email. Please check your inbox.
            </div>
          )}
          <form className="space-y-4" onSubmit={handleOtpSubmit}>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                6-digit code sent to your email
              </p>
            </div>
            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft size={16} />
                Back to Login
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="text-blue-400" size={28} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">KIIT HQ</p>
            <h1 className="text-2xl font-semibold text-white">University Admin Login</h1>
            <p className="text-slate-400 text-sm">Secure access to KIIT client dashboards</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="2105834@kiit.ac.in"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
          <p>Demo credentials</p>
          <p>Email: {KIIT_ADMIN_CREDENTIALS.email}</p>
          <p>Password: {KIIT_ADMIN_CREDENTIALS.password}</p>
        </div>
      </div>
    </div>
  );
};

export default UniversityAdminLogin;







