import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import authService from '../services/authService';

const VerifyCache = () => {
  const router = useRouter();
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error
  const [message, setMessage] = useState('');

  const runVerification = async () => {
    try {
      setStatus('verifying');
      setMessage('Verifying your session...');
      // Confirm token exists
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      // Validate against backend
      await authService.getProfile();
      localStorage.setItem('cacheVerified', 'true');
      setStatus('success');
      setMessage('Verified. Redirecting to your profile...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (e) {
      setStatus('error');
      setMessage('Verification failed. Please log in again.');
      try { await authService.logout(); } catch {}
      setTimeout(() => router.push('/'), 1200);
    }
  };

  useEffect(() => {
    // Auto-run verification on mount
    runVerification();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          {status === 'verifying' && <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}
          {status === 'success' && <ShieldCheck className="w-8 h-8 text-green-600" />}
          {status === 'error' && <AlertTriangle className="w-8 h-8 text-red-600" />}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Cache Verification</h1>
        <p className="text-gray-600 mb-6">{message || 'Click verify to continue to dashboard.'}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={runVerification}
            disabled={status === 'verifying'}
            className={`px-5 py-2 rounded-lg text-white ${status === 'verifying' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {status === 'verifying' ? 'Verifying...' : 'Verify Cache'}
          </button>
          <button
            onClick={async () => { try { await authService.logout(); } catch {}; localStorage.removeItem('cacheVerified'); router.push('/'); }}
            className="px-5 py-2 rounded-lg border border-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCache;


