import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAccess from './AdminAccess';
import AdminSolverRegistration from './AdminSolverRegistration';
import DoubtsPackBuilder from './DoubtsPackBuilder';
import SolverRequests from './SolverRequests';
import AdminNotifications from './AdminNotifications';
import DoubtPackPurchases from './DoubtPackPurchases';
import AdminRatingsFeedback from './AdminRatingsFeedback';
import AdminWithdrawals from './AdminWithdrawals';
import adminService from '../services/adminService';
import { 
  Shield, 
  UserPlus, 
  BookOpen, 
  LogOut, 
  Users, 
  TrendingUp,
  Loader2,
  FileText,
  Bell,
  Star,
  Wallet
} from 'lucide-react';

const ADMIN_AUTH_KEY = 'admin_authenticated';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState({
    totalSolvers: 0,
    totalDoubtPacks: 0,
    loading: true
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Fetch solvers and doubt packs in parallel
      const [solversResult, doubtPacksResult] = await Promise.allSettled([
        adminService.getAllSolvers(),
        adminService.getDoubtPacks()
      ]);

      // Extract data from results, handling both success and failure
      const solvers = solversResult.status === 'fulfilled' ? (solversResult.value || []) : [];
      const doubtPacks = doubtPacksResult.status === 'fulfilled' ? (doubtPacksResult.value || []) : [];

      // Count active solvers (isActive: true)
      const activeSolvers = Array.isArray(solvers) 
        ? solvers.filter(s => s.isActive !== false).length 
        : 0;

      setStats({
        totalSolvers: activeSolvers,
        totalDoubtPacks: Array.isArray(doubtPacks) ? doubtPacks.length : 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <AdminAccess />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg flex-shrink-0">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-indigo-100 text-sm mt-1">Manage solvers and doubt packs</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-lg text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/50 backdrop-blur-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-3">Total Solvers</p>
                {stats.loading ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight mb-3">
                    {stats.totalSolvers}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 ml-4">
                <Users className="text-white" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-600 mt-4">
              <TrendingUp size={16} />
              <span className="font-medium">Active solvers</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/50 backdrop-blur-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-3">Doubt Packs</p>
                {stats.loading ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight mb-3">
                    {stats.totalDoubtPacks}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0 ml-4">
                <BookOpen className="text-white" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-600 mt-4">
              <TrendingUp size={16} />
              <span className="font-medium">Total packs created</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications Sidebar */}
          <div className="lg:col-span-1">
            <AdminNotifications 
              onNotificationClick={(notification) => {
                if (notification.content.includes('solver request')) {
                  setActiveTab('requests');
                }
              }}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 bg-white/80 backdrop-blur-lg rounded-xl p-1 shadow-lg border border-white/50">
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'requests'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={18} />
                Solver Requests
              </button>
              <button
                onClick={() => setActiveTab('solver')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'solver'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus size={18} />
                Register Solver
              </button>
              <button
                onClick={() => setActiveTab('doubts')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'doubts'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen size={18} />
                Doubt Packs
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'purchases'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={18} />
                Purchases
              </button>
              <button
                onClick={() => setActiveTab('ratings')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'ratings'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star size={18} />
                Ratings & Feedback
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                  activeTab === 'withdrawals'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wallet size={18} />
                Withdrawals
              </button>
            </div>

            {/* Content Cards */}
            <div>
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FileText className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Solver Requests</h2>
                    <p className="text-gray-600 text-sm mt-1">Review and approve/reject solver requests</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <SolverRequests onRequestProcessed={fetchStats} />
              </div>
            </div>
          )}

          {activeTab === 'solver' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserPlus className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Register New Solver</h2>
                    <p className="text-gray-600 text-sm mt-1">Add users as solvers with their expertise areas</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdminSolverRegistration 
                  defaultOpen={true} 
                  inline={true}
                  onSolverRegistered={fetchStats}
                />
              </div>
            </div>
          )}

          {activeTab === 'doubts' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <BookOpen className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Doubt Pack Builder</h2>
                    <p className="text-gray-600 text-sm mt-1">Create and manage doubt packs for students</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <DoubtsPackBuilder 
                  defaultOpen={false}
                  onDoubtPackCreated={fetchStats}
                />
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <FileText className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Doubt Pack Purchases</h2>
                    <p className="text-gray-600 text-sm mt-1">View all university doubt pack purchases and revenue</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <DoubtPackPurchases />
              </div>
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Bell className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ratings & Feedback</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage user ratings and feedback from landing page</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdminRatingsFeedback />
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Wallet className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h2>
                    <p className="text-gray-600 text-sm mt-1">Review and process user withdrawal requests</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AdminWithdrawals />
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
