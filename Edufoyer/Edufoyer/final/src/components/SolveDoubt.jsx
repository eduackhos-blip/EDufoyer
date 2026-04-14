import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import solverService from '../services/solverService';

const SolveDoubt = () => {
  const { doubtId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('Accepting the doubt...');

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found, redirecting to login');
      setStatus('error');
      setMessage('Please log in to accept this doubt.');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }

    const accept = async () => {
      try {
        setStatus('pending');
        setMessage('Accepting the doubt...');
        const res = await solverService.acceptDoubt(doubtId);
        setStatus('success');
        setMessage(res?.message || 'Doubt accepted. Redirecting to session...');

        // Redirect to live session
        setTimeout(() => {
          navigate(`/dashboard/session/${doubtId}`);
        }, 1200);
      } catch (err) {
        console.error('SolveDoubt error:', err);
        setStatus('error');
        
        // Provide more specific error messages
        let errorMessage = 'Failed to accept the doubt.';
        
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('Network error') || err.message.includes('Unable to connect')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message.includes('Authentication failed') || err.message.includes('No authentication token') || err.message.includes('Invalid token format') || err.message.includes('session has expired')) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Redirect to login after a short delay
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }, 2000);
        } else if (err.message.includes('Invalid response format') || err.message.includes('undefined response') || err.message.includes('null response')) {
          errorMessage = 'Server returned invalid response. Please try again.';
        } else {
          errorMessage = err?.message || 'Failed to accept the doubt.';
        }
        
        setMessage(errorMessage);
      }
    };

    if (doubtId) accept();
  }, [doubtId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
        {status === 'pending' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
            <p className="text-sm text-gray-500 mt-2">Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
            <p className="text-sm text-gray-500 mt-2">Redirecting to session...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolveDoubt;








