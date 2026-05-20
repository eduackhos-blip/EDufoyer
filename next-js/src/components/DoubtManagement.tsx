// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Eye, CheckCircle, XCircle, Clock, Video, ArrowLeft, X, BookOpen, Calendar } from 'lucide-react';
import DoubtCard from './DoubtCard';
import doubtService from '../services/doubtService';
import solverService from '../services/solverService';
import authService from '../services/authService';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import AssignedDoubtsSection from './AssignedDoubtsSection';
import AvailableDoubtsSection from './AvailableDoubtsSection';
import AvailableDoubtsPageHeader from './doubts/AvailableDoubtsPageHeader';
import MyDoubtsPageHeader from './doubts/MyDoubtsPageHeader';
import MyDoubtsSection from './MyDoubtsSection';
import { useSocket } from '../contexts/SocketContext';

const DOUBT_TABS = [
  { id: 'my-doubts', label: 'My Doubts' },
  { id: 'available', label: 'Available' },
  { id: 'assigned', label: 'Assigned' },
];

function parseDoubtsTab(tabFromUrl) {
  if (tabFromUrl === 'available' || tabFromUrl === 'assigned' || tabFromUrl === 'my-doubts') {
    return tabFromUrl;
  }
  return 'available';
}

const DoubtManagement = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => parseDoubtsTab(tabFromUrl));
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
  const [solvedCount, setSolvedCount] = useState(0);
  const { socket: sharedSocket, connectSocket, isConnected } = useSocket();

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
    const result = await solverService.acceptDoubt(doubtId);
    fetchAvailableDoubts();
    fetchAssignedDoubts();
    return result;
  };

  const setDoubtsTab = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    router.replace(`/dashboard/doubts?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'solved') {
      router.replace('/dashboard/solved-doubts');
      return;
    }
    setActiveTab(parseDoubtsTab(tab));
  }, [searchParams, router]);

  const tabCounts = {
    'my-doubts': myDoubts.length,
    available: availableDoubts.length,
    assigned: assignedDoubts.length,
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!authService.isAuthenticated()) {
          router.push('/');
          return;
        }
        if (localStorage.getItem('cacheVerified') !== 'true') {
          router.push('/verify-cache');
          return;
        }
        await Promise.all([
          fetchMyDoubts(),
          fetchAvailableDoubts(),
          fetchAssignedDoubts(),
          solverService.getSolvedDoubts(1, 1).then((data) => {
            setSolvedCount(data?.pagination?.totalCount ?? 0);
          }).catch(() => setSolvedCount(0)),
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
    let onSocketConnect = null;
    let onSocketConnectError = null;
    let onDoubtAvailable = null;
    let onDoubtAssigned = null;
    let onDoubtRated = null;

    try {
      const socket = sharedSocket ?? connectSocket();
      if (socket) {
        socketRef.current = socket;

      const registerAsSolver = () => {
        (async () => {
          try {
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
          } catch {
            socket.emit('registerSolver', { subjects: [] });
          }
        })();
      };

      registerAsSolver();

      onSocketConnect = () => {
        console.log('✅ Solver socket connected', socket.id);
        registerAsSolver();
      };
      onSocketConnectError = (err) => {
        console.error('❌ Solver socket connect_error', err);
      };
      socket.on('connect', onSocketConnect);
      socket.on('connect_error', onSocketConnectError);

      onDoubtAvailable = (payload) => {
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
      };
      socket.on('doubt:available', onDoubtAvailable);

      onDoubtAssigned = ({ doubtId }) => {
        // Remove from available if it was shown
        setAvailableDoubts((prev) => prev.filter((d) => String(d._id || d.id) !== String(doubtId)));
        if (incomingDoubt && String(incomingDoubt.doubtId) === String(doubtId)) {
          setShowAvailableModal(false);
          setIncomingDoubt(null);
        }
      };
      socket.on('doubt:assigned', onDoubtAssigned);

      // Show toast to solver when asker rates and ends the session
      onDoubtRated = ({ doubtId, rating }) => {
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
      };
      socket.on('doubt:rated', onDoubtRated);
      }
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
        if (onSocketConnect) socketRef.current.off('connect', onSocketConnect);
        if (onSocketConnectError) socketRef.current.off('connect_error', onSocketConnectError);
        if (onDoubtAvailable) socketRef.current.off('doubt:available', onDoubtAvailable);
        if (onDoubtAssigned) socketRef.current.off('doubt:assigned', onDoubtAssigned);
        if (onDoubtRated) socketRef.current.off('doubt:rated', onDoubtRated);
        socketRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sharedSocket, connectSocket, isConnected]);

  const handleAcceptFromModal = async () => {
    if (!incomingDoubt) return;
    try {
      setIsJoiningSession(true);
      const acceptResult = await handleAcceptDoubt(incomingDoubt.doubtId);
      const sessionRoomId = acceptResult?.data?.roomId;
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

      if (!sessionRoomId) {
        throw new Error('Session room id missing after accept.');
      }
      
      // For immediate doubts, accept and join session
      setShowAvailableModal(false);
      setIncomingDoubt(null);
      router.push(`/dashboard/session/${encodeURIComponent(sessionRoomId)}`);
    } catch (e) {
      console.error('Error accepting doubt:', e);
      setError(e?.message || 'Failed to accept doubt.');
      setIsJoiningSession(false);
    }
  };

  const renderDoubtsOverlays = ({ includeViewAnswer = false } = {}) => (
    <>
      {toast ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      ) : null}
      {showAvailableModal && incomingDoubt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="mx-4 w-full max-w-md animate-in fade-in-0 zoom-in-95 rounded-xl bg-white shadow-2xl duration-300 transition-colors dark:bg-gray-800">
            <div className="rounded-t-xl bg-gradient-to-r from-green-500 to-green-600 p-4 text-white transition-colors dark:from-green-600 dark:to-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-colors dark:bg-white/30">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">New Doubt Available!</h3>
                    <p className="text-xs text-green-100 dark:text-green-200">A new doubt is waiting for you</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isJoiningSession) {
                      setShowAvailableModal(false);
                      setIncomingDoubt(null);
                    }
                  }}
                  disabled={isJoiningSession}
                  className="text-white/80 transition-colors hover:text-white disabled:opacity-50 dark:text-white/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 transition-colors dark:bg-green-900/30">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="mb-1 text-lg font-semibold text-gray-800 transition-colors dark:text-gray-100">
                  New Doubt Available
                </h4>
                <p className="text-sm text-gray-600 transition-colors dark:text-gray-400">
                  &quot;{incomingDoubt.subject}&quot; needs your expertise
                </p>
              </div>
              <div className="mb-4 rounded-lg bg-gray-50 p-3 transition-colors dark:bg-gray-700/50">
                <div className="mb-2 flex items-center space-x-2 text-gray-700 transition-colors dark:text-gray-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">Doubt Details</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 transition-colors dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Subject: {incomingDoubt.subject}</span>
                  </div>
                  {incomingDoubt.is_scheduled && incomingDoubt.scheduled_date ? (
                    <div className="mt-1.5 flex items-center space-x-2 rounded border border-blue-200 bg-blue-50 p-1.5 dark:border-blue-800 dark:bg-blue-900/20">
                      <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Scheduled:{' '}
                        {new Date(incomingDoubt.scheduled_date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {incomingDoubt.scheduled_time ||
                          new Date(incomingDoubt.scheduled_date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-1.5 text-gray-700 dark:text-gray-300">
                    <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Description:</p>
                    <p className="line-clamp-2 text-xs">{incomingDoubt.description}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAcceptFromModal}
                  disabled={isJoiningSession}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isJoiningSession ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      <span>{incomingDoubt.is_scheduled ? 'Accepting...' : 'Joining Session...'}</span>
                    </>
                  ) : incomingDoubt.is_scheduled ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Accept</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span>Accept & Join</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isJoiningSession) {
                      setShowAvailableModal(false);
                      setIncomingDoubt(null);
                    }
                  }}
                  disabled={isJoiningSession}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isJoiningSession ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow transition-colors duration-300 dark:bg-gray-800">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Preparing your session…</span>
          </div>
        </div>
      ) : null}
      {includeViewAnswer && viewAnswerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl transition-colors duration-300 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 transition-colors duration-300 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    New Answer
                  </span>
                  {viewAnswerModal.timeLabel ? (
                    <span className="text-xs text-gray-500">{viewAnswerModal.timeLabel}</span>
                  ) : null}
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {viewAnswerModal.solverName} answered your question
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setViewAnswerModal(null)}
                aria-label="Close answer modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Question</div>
              <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100">
                {viewAnswerModal.questionText}
              </div>
              <div className="mb-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Answer</div>
              <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
                &quot;{viewAnswerModal.answerText}&quot;
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

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

  if (activeTab === 'available') {
    return (
      <DashboardPageLayout
        loadingMessage="Loading doubts…"
        contentVariant="card"
        topBar={<AvailableDoubtsPageHeader solvedCount={solvedCount} />}
      >
        {renderDoubtsOverlays()}
        <AvailableDoubtsSection availableDoubts={availableDoubts} onAcceptDoubt={handleAcceptDoubt} />
      </DashboardPageLayout>
    );
  }

  if (activeTab === 'my-doubts') {
    return (
      <DashboardPageLayout
        loadingMessage="Loading doubts…"
        contentVariant="card"
        topBar={<MyDoubtsPageHeader availableCount={availableDoubts.length} solvedCount={solvedCount} />}
      >
        {renderDoubtsOverlays({ includeViewAnswer: true })}
        <MyDoubtsSection
          myDoubts={myDoubts}
          onViewAnswer={(payload) => setViewAnswerModal(payload)}
        />
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout loadingMessage="Loading doubts…">
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-200 bg-white p-4 transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Doubts</span>
              </button>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div
                className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
                role="tablist"
                aria-label="Doubts sections"
              >
                {DOUBT_TABS.map((tab) => {
                  const count = tabCounts[tab.id];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setDoubtsTab(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                        isActive
                          ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                      }`}
                    >
                      {tab.label}
                      {count != null ? ` (${count})` : ''}
                    </button>
                  );
                })}
              </div>
              <DarkModeToggle />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {renderDoubtsOverlays({ includeViewAnswer: true })}
          {/* Lists */}
          <div className="mt-4">
        {activeTab === 'assigned' && (
          <div>
            <AssignedDoubtsSection
              assignedDoubts={assignedDoubts}
              onJoinSession={(id) => router.push(`/dashboard/session/${id}`)}
            />
          </div>
        )}

          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default DoubtManagement;
