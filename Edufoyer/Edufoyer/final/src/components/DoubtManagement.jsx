import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Eye, CheckCircle, XCircle, Clock, Video, ArrowLeft, X, Menu, BookOpen } from 'lucide-react';
import DoubtCard from './DoubtCard';
import doubtService from '../services/doubtService';
import solverService from '../services/solverService';
import { io } from 'socket.io-client';
import authService from '../services/authService';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import SharedSidebar from './SharedSidebar';
import { buildDashboardSidebarItems } from './dashboardSidebarUtils';
import { DashboardSidebarSuggested, DashboardSidebarUserFooter } from './DashboardSidebarExtras';
import AssignedDoubtsSection from './AssignedDoubtsSection';
import AvailableDoubtsSection from './AvailableDoubtsSection';
import MyDoubtsSection from './MyDoubtsSection';

const DoubtManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'available' ? 'available' : 'my-doubts'); // Default to my doubts or from URL
  const [myDoubts, setMyDoubts] = useState([]);
  const [availableDoubts, setAvailableDoubts] = useState([]);
  const [assignedDoubts, setAssignedDoubts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomingDoubt, setIncomingDoubt] = useState(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [viewAnswerModal, setViewAnswerModal] = useState(null);
  const socketRef = useRef(null);
  const seenAvailableIdsRef = useRef(new Set());
  const pollingRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/');
          return;
        }
        const userData = await authService.getProfile();
        setUser(userData);
      } catch (e) {
        console.error('Error fetching user data:', e);
        authService.logout();
        navigate('/');
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const fetchMyDoubts = async () => {
    try {
      console.log('🔄 Fetching my doubts...');
      const data = await doubtService.getMyDoubts();
      console.log('📊 Received doubt data:', data);
      console.log('📝 Number of doubts:', data.doubts?.length || 0);

      const doubts = data.doubts || [];
      console.log('🗓️ Doubt date fields (shape check):', doubts.map((d) => ({
        id: d?._id,
        createdAt: d?.createdAt,
        resolvedAt: d?.solverDoubt?.resolved_at,
        status: d?.status,
        hasSolver: Boolean(d?.solver),
        solverName: d?.solver?.name,
        hasSolverDoubt: Boolean(d?.solverDoubt),
        feedbackComment: d?.solverDoubt?.feedback_comment
      })));

      setMyDoubts(doubts);
      console.log('✅ Doubts state updated');
    } catch (err) {
      console.error('❌ Error fetching my doubts:', err);
      setError(err.message || 'Failed to load your doubts.');
    }
  };

  const fetchAvailableDoubts = async () => {
    try {
      const data = await solverService.getAvailableDoubts();
      setAvailableDoubts(data || []);
    } catch (err) {
      console.error('Error fetching available doubts:', err);
      setError(err.message || 'Failed to load available doubts.');
    }
  };

  const fetchAssignedDoubts = async () => {
    try {
      const data = await solverService.getAssignedDoubts();
      setAssignedDoubts(data || []);
    } catch (err) {
      console.error('Error fetching assigned doubts:', err);
      setError(err.message || 'Failed to load assigned doubts.');
    }
  };

  const handleAcceptDoubt = async (doubtId) => {
    try {
      await solverService.acceptDoubt(doubtId);
      // Refresh the lists
      fetchAvailableDoubts();
      fetchAssignedDoubts();
    } catch (err) {
      console.error('Error accepting doubt:', err);
      setError(err.message || 'Failed to accept doubt.');
    }
  };

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'available') {
      setActiveTab('available');
    } else if (tabFromUrl === 'assigned') {
      setActiveTab('assigned');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!authService.isAuthenticated()) {
          navigate('/');
          return;
        }
        if (localStorage.getItem('cacheVerified') !== 'true') {
          navigate('/verify-cache');
          return;
        }
        await Promise.all([
          fetchMyDoubts(),
          fetchAvailableDoubts(),
          fetchAssignedDoubts()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Setup Socket.IO for realtime available doubts
    try {
      const socket = io(window.location.origin, { withCredentials: true });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Solver socket connected', socket.id);
      });
      socket.on('connect_error', (err) => {
        console.error('❌ Solver socket connect_error', err);
      });

      // Register solver with their subjects so backend can place into rooms
      (async () => {
        try {
          // Always register with userId so personal room emits work immediately
          const user = await authService.getProfile();
          const userId = user?.id || user?._id;
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
        } catch (e) {
          // fallback: at least try to join with token-embedded user id if available later
          socket.emit('registerSolver', { userId: null, subjects: [] });
        }
      })();

      socket.on('doubt:available', (payload) => {
        console.log('📥 doubt:available', payload);
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
        // Optimistically add to Available list so count updates instantly
        setAvailableDoubts((prev) => {
          const exists = prev.some((d) => String(d._id || d.id) === String(payload.doubtId));
          if (exists) return prev;
          return [{ 
            _id: payload.doubtId, 
            subject: payload.subject, 
            description: payload.description, 
            status: payload.status, 
            createdAt: payload.createdAt,
            is_scheduled: payload.is_scheduled || false,
            scheduled_date: payload.scheduled_date,
            scheduled_time: payload.scheduled_time,
          }, ...prev];
        });
      });

      socket.on('doubt:assigned', ({ doubtId }) => {
        // Remove from available if it was shown
        setAvailableDoubts((prev) => prev.filter((d) => String(d._id || d.id) !== String(doubtId)));
        if (incomingDoubt && String(incomingDoubt.doubtId) === String(doubtId)) {
          setShowAvailableModal(false);
          setIncomingDoubt(null);
        }
      });

      // Show toast to solver when asker rates and ends the session
      socket.on('doubt:rated', ({ doubtId, rating }) => {
        setToast({
          message: `Asker rated the session${rating ? ` (${rating}/5)` : ''} and left. Doubt ${String(doubtId).slice(-6)}.`,
        });
        // Optionally mark assigned doubt as completed in UI
        setAssignedDoubts((prev) => prev.map((d) => (
          String(d._id || d.id) === String(doubtId)
            ? { ...d, solverDoubt: { ...(d.solverDoubt || {}), resolution_status: 'session_completed' } }
            : d
        )));
        // Auto-hide toast after 5s
        setTimeout(() => setToast(null), 5000);
      });
    } catch (sockErr) {
      console.error('Socket setup error:', sockErr);
    }

    // Fallback polling to trigger modal if socket fails
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        try {
          const latest = await solverService.getAvailableDoubts();
          // Seed seen set first time
          if (seenAvailableIdsRef.current.size === 0) {
            latest.forEach((d) => seenAvailableIdsRef.current.add(String(d._id || d.id)));
          }
          // Detect a newly appeared doubt
          const newItem = latest.find((d) => !seenAvailableIdsRef.current.has(String(d._id || d.id)));
          if (newItem) {
            seenAvailableIdsRef.current.add(String(newItem._id || newItem.id));
            setAvailableDoubts((prev) => {
              const exists = prev.some((p) => String(p._id || p.id) === String(newItem._id || newItem.id));
              return exists ? prev : [newItem, ...prev];
            });
            setIncomingDoubt({
              doubtId: String(newItem._id || newItem.id),
              subject: newItem.subject,
              description: newItem.description,
              status: newItem.status,
              createdAt: newItem.createdAt,
              is_scheduled: newItem.is_scheduled || false,
              scheduled_date: newItem.scheduled_date,
              scheduled_time: newItem.scheduled_time,
            });
            setShowAvailableModal(true);
          }
        } catch {}
      }, 5000);
    }

    // Listen for doubt creation callback
    const handleDoubtCreated = () => {
      console.log('🎯 Callback: Doubt created, refreshing doubts list...');
      fetchMyDoubts();
    };

    // Listen for custom events
    const handleDoubtCreatedEvent = (event) => {
      console.log('🎯 Event: Doubt created event received:', event.detail);
      fetchMyDoubts();
    };

    // Listen for localStorage changes
    const handleStorageChange = (event) => {
      if (event.key === 'doubtCreated') {
        console.log('🎯 Storage: Doubt created flag detected, refreshing doubts list...');
        fetchMyDoubts();
      }
    };

    window.onDoubtCreated = handleDoubtCreated;
    window.addEventListener('doubtCreated', handleDoubtCreatedEvent);
    window.addEventListener('storage', handleStorageChange);

    // Periodic check for doubt creation flag (fallback)
    const checkInterval = setInterval(() => {
      const doubtCreatedFlag = localStorage.getItem('doubtCreated');
      if (doubtCreatedFlag) {
        console.log('🎯 Periodic: Doubt created flag found, refreshing...');
        fetchMyDoubts();
        localStorage.removeItem('doubtCreated');
      }
    }, 1000); // Check every 1 second (more aggressive)
    
    // Also check on page focus (when user comes back to this tab)
    const handlePageFocus = () => {
      console.log('🎯 Page focused, checking for new doubts...');
      fetchMyDoubts();
    };
    
    window.addEventListener('focus', handlePageFocus);

    // Cleanup
    return () => {
      window.onDoubtCreated = null;
      window.removeEventListener('doubtCreated', handleDoubtCreatedEvent);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handlePageFocus);
      clearInterval(checkInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const handleAcceptFromModal = async () => {
    if (!incomingDoubt) return;
    try {
      setIsJoiningSession(true);
      await handleAcceptDoubt(incomingDoubt.doubtId);
      // Brief UX delay to communicate session preparation
      await new Promise((r) => setTimeout(r, 1500));
      
      // For scheduled doubts, only accept (don't join session)
      if (incomingDoubt.is_scheduled && incomingDoubt.scheduled_date) {
        setShowAvailableModal(false);
        setIncomingDoubt(null);
        setIsJoiningSession(false);
        // Show success message
        alert('Doubt accepted successfully! You will receive an email with the meeting link at the scheduled time.');
        return;
      }
      
      // For immediate doubts, accept and join session
      setShowAvailableModal(false);
      setIncomingDoubt(null);
      navigate(`/dashboard/session/${incomingDoubt.doubtId}`);
    } catch (e) {
      // keep modal open to retry or dismiss
      setIsJoiningSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading doubts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 text-blue-500 dark:text-blue-400 hover:underline text-sm transition-colors">
          Try again
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const handleHelpSupport = () => navigate('/contact');

  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      <aside
        className={`bg-white fixed inset-y-0 left-0 z-40 w-[356px] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden lg:ml-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                onClick={() => setIsSidebarOpen((o) => !o)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">My Doubts</span>
              </button>
            </div>

            <DarkModeToggle />
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      {showAvailableModal && incomingDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
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

      {isJoiningSession && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 transition-colors duration-300">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Preparing your session…</span>
          </div>
        </div>
      )}

      {viewAnswerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transition-colors duration-300">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                    New Answer
                  </span>
                  {viewAnswerModal.timeLabel && (
                    <span className="text-xs text-gray-500">{viewAnswerModal.timeLabel}</span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {viewAnswerModal.solverName} answered your question
                </h3>
              </div>
              <button
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                onClick={() => setViewAnswerModal(null)}
                aria-label="Close answer modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Question</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 whitespace-pre-wrap">
                {viewAnswerModal.questionText}
              </div>

              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-4 mb-2">Answer</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 whitespace-pre-wrap">
                &quot;{viewAnswerModal.answerText}&quot;
              </div>
            </div>
          </div>
        </div>
      )}
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl transition-colors duration-300">
            <button
              onClick={() => setActiveTab('my-doubts')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'my-doubts'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
              }`}
            >
              My Doubts ({myDoubts.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'available'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
              }`}
            >
              Available ({availableDoubts.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'assigned'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
              }`}
            >
              Assigned ({assignedDoubts.length})
            </button>
          </div>

          {/* Lists */}
          <div className="mt-4">
        {activeTab === 'my-doubts' && (
          <div>
            <MyDoubtsSection
              myDoubts={myDoubts}
              onViewAnswer={(payload) => setViewAnswerModal(payload)}
            />
          </div>
        )}

        {activeTab === 'available' && (
          <div>
            <AvailableDoubtsSection
              availableDoubts={availableDoubts}
              onAcceptDoubt={handleAcceptDoubt}
            />
          </div>
        )}

        {activeTab === 'assigned' && (
          <div>
            <AssignedDoubtsSection
              assignedDoubts={assignedDoubts}
              onJoinSession={(id) => navigate(`/dashboard/session/${id}`)}
            />
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtManagement;
