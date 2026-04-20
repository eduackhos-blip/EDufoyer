import React, { useState, useEffect, useRef } from 'react';
import { Clock, User, Bell, CheckCircle, AlertCircle, RefreshCw, Video, Calendar } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import notificationService from '../services/notificationService';
import doubtService from '../services/doubtService';
import SolverAcceptanceNotification from './SolverAcceptanceNotification';
import { useSocket } from '../contexts/SocketContext';

const AwaitingSolverPage = () => {
  const { doubtId } = useParams();
  const router = useRouter();
  const [doubt, setDoubt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showAcceptanceNotification, setShowAcceptanceNotification] = useState(false);
  const [solverInfo, setSolverInfo] = useState(null);
  const socketRef = useRef(null);
  const { socket: sharedSocket, connectSocket } = useSocket();

  // Format time elapsed
  const formatTimeElapsed = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Fetch doubt details
  const fetchDoubtDetails = async () => {
    try {
      const response = await doubtService.getDoubtById(doubtId);
      console.log('📋 Doubt response:', response);
      
      // Handle different response structures
      let doubtData;
      if (response && response.data && response.data.doubt) {
        doubtData = response.data.doubt;
      } else if (response && response.doubt) {
        doubtData = response.doubt;
      } else if (response && response._id) {
        doubtData = response;
      } else {
        throw new Error('Invalid response structure');
      }
      
      console.log('📋 Processed doubt data:', doubtData);
      setDoubt(doubtData);
      
      // If doubt is assigned, show acceptance modal instead of auto-redirect
      if (doubtData.status === 'assigned') {
        setSolverInfo({ name: 'Solver', doubtTitle: doubtData.subject });
        setShowAcceptanceNotification(true);
      }
    } catch (err) {
      console.error('Error fetching doubt:', err);
      setDoubt(null);
      setError('Failed to load doubt details.');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const notificationData = await notificationService.getNotifications();
      console.log('📋 Notifications response:', notificationData);
      
      // Handle different response structures
      let notifications = [];
      if (Array.isArray(notificationData)) {
        notifications = notificationData;
      } else if (notificationData && Array.isArray(notificationData.data)) {
        notifications = notificationData.data;
      } else if (notificationData && Array.isArray(notificationData.notifications)) {
        notifications = notificationData.notifications;
      }
      
      setNotifications(notifications);
      
      // Check for doubt assignment notification
      const assignmentNotification = notifications.find(
        n => n.doubt_id === doubtId && n.message_type === 'DOUBT_ASSIGNED'
      );
      
      if (assignmentNotification) {
        // Show acceptance notification instead of direct redirect
        setSolverInfo({
          name: 'Solver', // You can extract this from the notification content
          doubtTitle: doubt?.subject || 'Your doubt'
        });
        setShowAcceptanceNotification(true);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDoubtDetails(), fetchNotifications()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds (reduced to avoid rate limiting)
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [doubtId]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchDoubtDetails(), fetchNotifications()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [doubtId]);

  // Realtime: subscribe to the subject room so the asker gets instant assignment modal
  useEffect(() => {
    if (!doubt?.subject) return;
    let onDoubtAssigned = null;
    try {
      const socket = sharedSocket ?? connectSocket();
      if (socket) {
        socketRef.current = socket;
        const subjects = [String(doubt.subject).toLowerCase()];
        socket.emit('registerSolver', { userId: null, subjects });
        onDoubtAssigned = ({ doubtId: assignedId }) => {
          if (String(assignedId) === String(doubtId)) {
            setSolverInfo({ name: 'Solver', doubtTitle: doubt.subject });
            setShowAcceptanceNotification(true);
          }
        };
        socket.on('doubt:assigned', onDoubtAssigned);
      }
    } catch {}
    return () => {
      if (socketRef.current && onDoubtAssigned) {
        socketRef.current.off('doubt:assigned', onDoubtAssigned);
      }
      socketRef.current = null;
    };
  }, [doubtId, doubt?.subject, sharedSocket, connectSocket]);

  // Timer for elapsed time
  useEffect(() => {
    if (doubt?.createdAt) {
      const startTime = new Date(doubt.createdAt).getTime();
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [doubt?.createdAt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading doubt details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-300 dark:border-gray-600 p-8 text-center max-w-md transition-colors duration-300">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Error Loading Doubt</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-gray-100">
      <div className="mx-auto h-[1035.75px] w-[1071px] overflow-hidden">
      <p className="px-3 pb-0 pt-2 text-xs text-gray-400">waiting page</p>

      <div className="mx-3 mb-5 mt-1 rounded-xl px-5 py-5" style={{ background: '#2563EB' }}>
        <h1 className="text-2xl font-bold leading-tight text-white">Awaiting Solver</h1>
        <p className="mb-4 mt-0.5 text-sm text-blue-200">Your doubt is waiting for a solver to accept it</p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Please keep refreshing</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white border-opacity-50 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mx-3 flex gap-4">
        <div className="flex h-[600px] w-[674px] flex-col gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col items-center gap-3 pt-1 text-center">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full" style={{ background: '#2563EB' }}>
              <Clock size={28} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[19px] font-bold text-gray-900">Waiting for Solver</h2>
              <p className="mt-1 text-[13px] leading-snug text-gray-500">
                Your doubt has been submitted and is being matched with available solvers.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 px-4 py-4">
            <p className="mb-3 text-[13px] font-semibold text-gray-800">Doubt Details</p>
            <div className="mb-2.5 flex items-center gap-3">
              <span className="w-20 shrink-0 text-[12.5px] text-gray-500">Subject:</span>
              <span className="rounded-full border border-[#93C5FD] bg-[#EFF6FF] px-3 py-1 text-[12px] font-semibold text-[#2563EB]">
                {doubt?.subject || 'Unknown Subject'}
              </span>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <span className="w-20 shrink-0 text-[12.5px] text-gray-500">Category:</span>
              <span className="rounded-full border border-[#86EFAC] bg-[#F0FDF4] px-3 py-1 text-[12px] font-semibold text-[#16A34A] capitalize">
                {doubt?.category || 'unspecified'}
              </span>
            </div>
            <div>
              <p className="mb-1.5 text-[12.5px] text-gray-500">Description:</p>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[13px] text-gray-700">
                {doubt?.description || 'Description unavailable'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#BFDBFE] bg-[#EFF6FF] py-3 text-[13.5px] font-semibold">
            <Clock size={15} color="#2563EB" />
            <span className="text-gray-700">Time Elapsed:</span>
            <span className="font-bold text-[#2563EB]">{formatTimeElapsed(timeElapsed)}</span>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[12.5px] leading-relaxed text-[#92400E]">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#F59E0B]" />
            <span>Please wait while we find a suitable solver for your doubt. This usually takes a few moments.</span>
          </div>
        </div>

        <div className="flex  w-[325px] flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={14} className="text-gray-600" />
              <span className="text-[13px] font-semibold text-gray-800">Live Updates</span>
            </div>
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-3">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" />
                <div>
                  <p className="text-[11.5px] leading-snug text-gray-700">
                    {notifications.filter((n) => n.doubt_id === doubtId)[0]?.content ||
                      `Your doubt "${doubt?.subject || 'your subject'}" has been submitted successfully and is awaiting a solver.`}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {notifications.filter((n) => n.doubt_id === doubtId)[0]?.createdAt
                      ? new Date(notifications.filter((n) => n.doubt_id === doubtId)[0].createdAt).toLocaleTimeString()
                      : new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-gray-800">What happens next?</p>
            <div className="flex flex-col gap-3.5">
              {[
                { n: 1, color: '#3B82F6', title: 'Solver Notification', desc: 'Available solvers are notified about your doubt' },
                { n: 2, color: '#8B5CF6', title: 'Solver Accepts', desc: 'A solver reviews and accepts your doubt' },
                { n: 3, color: '#EC4899', title: 'Session Ready', desc: 'You can join after clicking Accept/Join in the popup' }
              ].map(({ n, color, title, desc }) => (
                <div key={n} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold leading-tight text-gray-800">{title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#2563EB] px-4 py-4">
            <p className="mb-1 text-[13px] font-bold text-white">Need Help?</p>
            <p className="text-[11.5px] leading-snug text-blue-100">
              If no solver accepts your doubt within 30 minutes, it will be automatically reassigned to ensure you get help.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <p className="mb-3 text-[13px] font-semibold text-gray-800">Quick Actions</p>
            <button
              onClick={() => router.push('/dashboard/doubts')}
              className="mb-2 w-full rounded-lg bg-[#2563EB] py-2.5 text-[13px] font-semibold text-white"
            >
              Ask Another Question
            </button>
            <button
              onClick={() => router.push('/dashboard/doubts')}
              className="w-full rounded-lg border border-gray-300 py-2.5 text-[13px] font-medium text-gray-700"
            >
              View My Doubts
            </button>
          </div>
        </div>
      </div>

      <div className="h-6" />
      </div>

      {/* Solver Acceptance Notification */}
      <SolverAcceptanceNotification
        isVisible={showAcceptanceNotification}
        onClose={() => setShowAcceptanceNotification(false)}
        doubtId={doubtId}
        solverName={solverInfo?.name}
        doubtTitle={solverInfo?.doubtTitle}
      />
    </div>
  );
};

export default AwaitingSolverPage;
