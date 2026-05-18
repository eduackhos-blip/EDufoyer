// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Video, Calendar, CheckCircle, Clock, X, Menu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import { useSocket } from '../contexts/SocketContext';
import AskDoubt from './AskDoubt';
import SolverRegistration from './SolverRegistration';
import SolverRequestForm from './SolverRequestForm';
import WalletDisplay from './WalletDisplay';
import DarkModeToggle from './DarkModeToggle';
import SharedSidebar from './SharedSidebar';
import { buildDashboardSidebarItems } from './dashboardSidebarUtils';
import { DashboardSidebarSuggested, DashboardSidebarUserFooter } from './DashboardSidebarExtras';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Overall');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlySolved, setMonthlySolved] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [incomingDoubt, setIncomingDoubt] = useState(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const [toast, setToast] = useState(null);
  const seenAvailableIdsRef = useRef(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSolverRequestForm, setShowSolverRequestForm] = useState(false);
  const { socket: sharedSocket, connectSocket, isConnected } = useSocket();
  
  // Handle responsive sidebar - close on mobile by default, open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop - ensure sidebar is open
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/');
          return;
        }
        const isCacheVerified = localStorage.getItem('cacheVerified') === 'true';
        if (!isCacheVerified) {
          router.push('/verify-cache');
          return;
        }

        const userData = await authService.getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        authService.logout();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Fetch solver metrics
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/solver/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json?.success) {
          setMonthlySolved(json.data?.solvedCount || 0);
          setAvgRating(json.data?.avgRating ?? null);
        }
      } catch {}
    })();

    let onDoubtAvailable = null;
    let onDoubtAssigned = null;
    let onDoubtRated = null;
    let onDoubtCompleted = null;
    let onSocketConnect = null;

    const registerAsSolver = (socket) => {
      (async () => {
        try {
          const profile = await authService.getProfile();
          const userId = profile?.id || profile?._id;
          let subjects = [];
          try {
            const profRes = await fetch('/api/profile', {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const profJson = await profRes.json();
            const strongSubject = profJson?.data?.strongSubject;
            subjects = strongSubject ? [String(strongSubject).toLowerCase()] : [];
          } catch {}
          socket.emit('registerSolver', { userId, subjects });
        } catch {
          socket.emit('registerSolver', { subjects: [] });
        }
      })();
    };

    // Realtime listener for solver modal
    try {
      const socket = sharedSocket ?? connectSocket();
      socketRef.current = socket;

      if (socket) {
        registerAsSolver(socket);
        onSocketConnect = () => registerAsSolver(socket);
        socket.on('connect', onSocketConnect);

        onDoubtAvailable = (payload) => {
          setIncomingDoubt({
            doubtId: payload.doubtId,
            subject: payload.subject,
            description: payload.description,
            status: payload.status,
            createdAt: payload.createdAt,
            is_scheduled: payload.is_scheduled || false,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
          });
          setShowAvailableModal(true);
        };

        onDoubtAssigned = ({ doubtId }) => {
          if (incomingDoubt && String(incomingDoubt.doubtId) === String(doubtId)) {
            setShowAvailableModal(false);
            setIncomingDoubt(null);
          }
        };

        onDoubtRated = ({ doubtId, rating }) => {
          setToast({ message: `Asker rated ${rating ? `(${rating}/5)` : ''} and ended session. Doubt ${String(doubtId).slice(-6)}.` });
          setTimeout(() => setToast(null), 5000);
        };

        onDoubtCompleted = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/solver/metrics', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json?.success) {
              setMonthlySolved(json.data?.solvedCount || 0);
              setAvgRating(json.data?.avgRating ?? null);
            }
          } catch {}
        };

        socket.on('doubt:available', onDoubtAvailable);
        socket.on('doubt:assigned', onDoubtAssigned);
        socket.on('doubt:rated', onDoubtRated);
        socket.on('doubt:completed', onDoubtCompleted);
      }
    } catch {}

    // Fallback polling every 15s to keep metrics fresh
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch('/api/solver/available-doubts', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          const list = json?.data || [];
          if (seenAvailableIdsRef.current.size === 0) {
            list.forEach((d) => seenAvailableIdsRef.current.add(String(d._id || d.id)));
          } else {
            const fresh = list.find((d) => !seenAvailableIdsRef.current.has(String(d._id || d.id)));
            if (fresh) {
              seenAvailableIdsRef.current.add(String(fresh._id || fresh.id));
              setIncomingDoubt({
                doubtId: String(fresh._id || fresh.id),
                subject: fresh.subject,
                description: fresh.description,
                status: fresh.status,
                createdAt: fresh.createdAt,
                is_scheduled: fresh.is_scheduled || false,
                scheduled_date: fresh.scheduled_date,
                scheduled_time: fresh.scheduled_time,
              });
              setShowAvailableModal(true);
            }
          }
        } catch {}
        // refresh metrics too
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch('/api/solver/metrics', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json?.success) {
            setMonthlySolved(json.data?.solvedCount || 0);
            setAvgRating(json.data?.avgRating ?? null);
          }
        } catch {}
      }, 15000);
    }

    return () => {
      const socket = socketRef.current;
      if (socket) {
        if (onSocketConnect) socket.off('connect', onSocketConnect);
        if (onDoubtAvailable) socket.off('doubt:available', onDoubtAvailable);
        if (onDoubtAssigned) socket.off('doubt:assigned', onDoubtAssigned);
        if (onDoubtRated) socket.off('doubt:rated', onDoubtRated);
        if (onDoubtCompleted) socket.off('doubt:completed', onDoubtCompleted);
      }
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [router, sharedSocket, connectSocket, isConnected]);

  const handleAcceptFromModal = async () => {
    if (!incomingDoubt) return;
    try {
      setIsJoiningSession(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/solver/accept-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doubtId: incomingDoubt.doubtId })
      });
      
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to accept doubt');
      }

      const sessionRoomId = data?.data?.roomId;
      if (!sessionRoomId) {
        throw new Error('Accept succeeded but session room id was missing.');
      }
      
      await new Promise((r) => setTimeout(r, 1200));
      
      // For scheduled doubts, only accept (don't join session)
      if (incomingDoubt.is_scheduled && incomingDoubt.scheduled_date) {
        setShowAvailableModal(false);
        setIncomingDoubt(null);
        setIsJoiningSession(false);
        // Show success message
        alert('Doubt accepted successfully! You will receive an email with the meeting link at the scheduled time.');
        return;
      }
      
      // For immediate doubts, accept and join session (full room id required for timer + session)
      setShowAvailableModal(false);
      setIncomingDoubt(null);
      router.push(`/dashboard/session/${encodeURIComponent(sessionRoomId)}`);
    } catch {
      setIsJoiningSession(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  const performanceData = [
    { name: 'Mon', value: 2.8 },
    { name: 'Tue', value: 2.2 },
    { name: 'Wed', value: 2.0 },
    { name: 'Thu', value: 2.1 },
    { name: 'Fri', value: 3.8 },
    { name: 'Sat', value: 2.0 }
  ];

  const messages = [
    {
      id: 1,
      name: "Mayowa Ade",
      initials: "MA",
      message: "Hey! I just finished solving the numerical",
      subtitle: "First Chapter of Project .doc",
      time: "09:34 am",
      color: "bg-orange-500"
    },
    {
      id: 2,
      name: "Olawuyi Tobi",
      initials: "OT",
      message: "Can you check out the formulas in these images att...",
      subtitle: "Image .jpg    Form .jpg    Image 2 .jpg",
      time: "12:30 pm",
      color: "bg-pink-500"
    }
  ];

  const handleHelpSupport = () => router.push('/contact');
  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: perspective(1000px) rotateY(-15deg) rotateZ(0deg) translateY(0px);
          }
          25% {
            transform: perspective(1000px) rotateY(-10deg) rotateZ(20deg) translateY(-2px);
          }
          50% {
            transform: perspective(1000px) rotateY(-15deg) rotateZ(0deg) translateY(0px);
          }
          75% {
            transform: perspective(1000px) rotateY(-20deg) rotateZ(-20deg) translateY(-2px);
          }
        }
        .welcome-3d {
          display: inline-block;
          position: relative;
          transform: perspective(800px) rotateX(3deg) rotateY(-5deg);
          transform-style: preserve-3d;
          font-weight: 900;
          letter-spacing: 0px;
          color: #ffffff;
          padding: 2px 4px;
          margin: 0;
          line-height: 1.2;
          cursor: pointer;
          transition: transform 0.2s ease-out;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.15) 0%,
            rgba(255,255,255,0.05) 50%,
            rgba(0,0,0,0.1) 100%
          );
          border: 1.5px solid rgba(255,255,255,0.2);
          border-top: 1.5px solid rgba(255,255,255,0.3);
          border-left: 1.5px solid rgba(255,255,255,0.3);
          border-bottom: 1.5px solid rgba(0,0,0,0.3);
          border-right: 1.5px solid rgba(0,0,0,0.3);
          box-shadow: 
            /* Multiple shadow layers for brick depth */
            inset 0px 1px 0px rgba(255,255,255,0.2),
            inset 1px 0px 0px rgba(255,255,255,0.15),
            inset 0px -1px 0px rgba(0,0,0,0.2),
            inset -1px 0px 0px rgba(0,0,0,0.2),
            /* Outer shadows for 3D effect */
            2px 2px 0px rgba(0,0,0,0.3),
            4px 4px 0px rgba(0,0,0,0.25),
            6px 6px 0px rgba(0,0,0,0.2),
            8px 8px 0px rgba(0,0,0,0.15),
            10px 10px 0px rgba(0,0,0,0.1),
            12px 12px 0px rgba(0,0,0,0.05),
            /* Glow */
            0px 0px 15px rgba(255,255,255,0.2);
          text-shadow: 
            /* Text depth */
            1px 1px 2px rgba(0,0,0,0.5),
            2px 2px 4px rgba(0,0,0,0.4),
            /* Highlight */
            -1px -1px 1px rgba(255,255,255,0.3);
          filter: drop-shadow(8px 8px 16px rgba(0,0,0,0.5));
        }
        .welcome-3d:hover {
          transform: perspective(800px) rotateX(8deg) rotateY(-8deg) translateY(-8px) scale(1.1);
          z-index: 10;
          filter: drop-shadow(12px 12px 24px rgba(0,0,0,0.6));
          box-shadow: 
            inset 0px 1px 0px rgba(255,255,255,0.3),
            inset 1px 0px 0px rgba(255,255,255,0.25),
            inset 0px -1px 0px rgba(0,0,0,0.3),
            inset -1px 0px 0px rgba(0,0,0,0.3),
            2px 2px 0px rgba(0,0,0,0.3),
            4px 4px 0px rgba(0,0,0,0.25),
            6px 6px 0px rgba(0,0,0,0.2),
            8px 8px 0px rgba(0,0,0,0.15),
            10px 10px 0px rgba(0,0,0,0.1),
            12px 12px 0px rgba(0,0,0,0.05),
            0px 0px 20px rgba(255,255,255,0.3);
        }
        .welcome-3d::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.05) 2px,
              rgba(0,0,0,0.05) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.03) 20px,
              rgba(255,255,255,0.03) 22px
            );
          pointer-events: none;
          border-radius: 2px;
        }
        .welcome-3d::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.1) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0,0,0,0.15) 100%
          );
          pointer-events: none;
          z-index: -1;
          border-radius: 4px;
        }
      `}</style>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      {showAvailableModal && incomingDoubt && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-t-xl p-4 text-white transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white/20 dark:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">New Doubt Available!</h3>
                    <p className="text-green-100 dark:text-green-200 text-xs">A new doubt is waiting for you</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (!isJoiningSession) { setShowAvailableModal(false); setIncomingDoubt(null); } }}
                  disabled={isJoiningSession}
                  className="text-white/80 dark:text-white/90 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 transition-colors">
                  New Doubt Available
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  "{incomingDoubt.subject}" needs your expertise
                </p>
              </div>

              {/* Doubt Details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 transition-colors">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-medium text-sm">Doubt Details</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Subject: {incomingDoubt.subject}</span>
                  </div>
                  {incomingDoubt.is_scheduled && incomingDoubt.scheduled_date && (
                    <div className="flex items-center space-x-2 mt-1.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-semibold text-xs">
                        Scheduled: {new Date(incomingDoubt.scheduled_date).toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {incomingDoubt.scheduled_time || new Date(incomingDoubt.scheduled_date).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                  <div className="mt-1.5 text-gray-700 dark:text-gray-300">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Description:</p>
                    <p className="line-clamp-2 text-xs">{incomingDoubt.description}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleAcceptFromModal}
                  disabled={isJoiningSession}
                  className="w-full bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                >
                  {isJoiningSession ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{incomingDoubt.is_scheduled ? 'Accepting...' : 'Joining Session...'}</span>
                    </>
                  ) : (
                    <>
                      {incomingDoubt.is_scheduled ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Accept</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Accept & Join</span>
                        </>
                      )}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => { if (!isJoiningSession) { setShowAvailableModal(false); setIncomingDoubt(null); } }}
                  disabled={isJoiningSession}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  Dismiss
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors">
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center transition-colors">
                  💡 You can also accept doubts from your dashboard anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar Wrapper */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SharedSidebar
          items={sidebarItems}
          onClose={() => setIsSidebarOpen(false)}
          showCloseButton={true}
          belowNav={<DashboardSidebarSuggested />}
          footer={
            <DashboardSidebarUserFooter
              user={user}
              onLogout={handleLogout}
              onHelpSupport={handleHelpSupport}
            />
          }
        />
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden lg:ml-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Menu Toggle & Dark Mode Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <DarkModeToggle />
              </div>
              
              {/* Right side - Action buttons */}
              <div className="flex items-center gap-3">
                {/* Solve a Doubt */}
                <button 
                  onClick={() => setShowSolverRequestForm(true)}
                  className="px-4 py-2 bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-700 text-white rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Solve a Doubt
                </button>

                {/* Ask a Doubt */}
                <AskDoubt />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-8 overflow-y-auto h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-8 text-white mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2 flex items-center flex-wrap gap-1">
                {/* Split "Welcome" into individual letters */}
                {("Welcome back, " + (user?.name || 'User')).split('').map((char, index) => {
                  if (char === ' ') {
                    return <span key={index} className="w-2"></span>;
                  }
                  return (
                    <span key={index} className="welcome-3d">
                      {char}
                    </span>
                  );
                })}
                <span className="ml-2 inline-block">
                  <span 
                    className="inline-block text-4xl"
                    style={{
                      animation: 'wave 1s ease-in-out infinite',
                      transformStyle: 'preserve-3d',
                      transform: 'perspective(1000px) rotateY(-15deg) rotateZ(0deg)',
                      filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.2), -1px -1px 2px rgba(255,255,255,0.1)'
                    }}
                  >
                    👋
                  </span>
                </span>
              </h2>
              <p className="text-blue-100 dark:text-blue-200 mb-1">You've cleared <span className="font-semibold">{monthlySolved}</span> doubts this month</p>
              <p className="text-blue-100 dark:text-blue-200">Average rating: <span className="font-semibold">{avgRating ? avgRating.toFixed(1) : '—'}</span></p>
            </div>
            {/* Character Illustration */}
            <div className="absolute right-8 top-4">
              <div className="w-32 h-32 bg-blue-300 dark:bg-blue-500 rounded-full opacity-30"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full opacity-20"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Wallet Display */}
            <WalletDisplay />

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">Performance</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {['Overall', 'Completed'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-300 ${
                          activeTab === tab
                            ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      className="dark:text-gray-400"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      domain={[1, 4]}
                      className="dark:text-gray-400"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      fill="url(#gradient)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Solver Request Form Modal */}
      <SolverRequestForm
        isOpen={showSolverRequestForm}
        onClose={() => setShowSolverRequestForm(false)}
        onSuccess={() => {
          setShowSolverRequestForm(false);
          setToast({
            type: 'success',
            message: 'Solver request submitted successfully! Admin will review your request.'
          });
        }}
      />
    </div>
    </>
  );
};

export default Dashboard;
