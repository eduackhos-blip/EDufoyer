import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ShieldOff, Loader2 } from 'lucide-react';

const AdminAccess = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Allow dev bypass and admin authenticated flag
        const isBypass = localStorage.getItem('adminBypass') === 'true';
        const isAdminAuthenticated = localStorage.getItem('admin_authenticated') === 'true';

        if (!authService.isAuthenticated() && !isBypass && !isAdminAuthenticated) {
          navigate('/admin/login');
          return;
        }

        let userProfile = null;
        if (isBypass || isAdminAuthenticated) {
          userProfile = { role: 'admin' };
        } else {
          try {
          userProfile = await authService.getProfile();
          } catch (error) {
            // If getProfile fails but admin_authenticated is set, allow access
            if (isAdminAuthenticated) {
              userProfile = { role: 'admin' };
            } else {
              throw error;
            }
          }
        }
        setUser(userProfile);

        if (userProfile.role !== 'admin') {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Admin access check failed:', error);
        // If admin_authenticated flag is set, allow access anyway
        if (localStorage.getItem('admin_authenticated') === 'true') {
          setUser({ role: 'admin' });
        } else {
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 animate-fade-in">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 animate-fade-in">
          <ShieldOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">You don't have admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null; // This component is just for access control
};

export default AdminAccess;
