// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Video, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import { useSocket } from '../contexts/SocketContext';
import AskDoubt from './AskDoubt';
import SolverRequestForm from './SolverRequestForm';
import { buildDashboardSidebarItems } from './dashboardSidebarUtils';
import DashboardShell from './dashboard/DashboardShell';
import DashboardWelcomeHeader from './dashboard/DashboardWelcomeHeader';
import DashboardStatCards from './dashboard/DashboardStatCards';
import DashboardWalletCard from './dashboard/DashboardWalletCard';
import DashboardWithdrawTimeline from './dashboard/DashboardWithdrawTimeline';
import { isDashboardSolver } from '../utils/dashboardUserUtils';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const location = {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  };
  const [showSolverRequestForm, setShowSolverRequestForm] = useState(false);
  const [askDoubtOpenSignal, setAskDoubtOpenSignal] = useState(0);
  const { socket: sharedSocket, connectSocket, isConnected } = useSocket();


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
  }, [router]);

  const isSolver = isDashboardSolver(user);

  useEffect(() => {
    if (!isSolver || isLoading) return;

    let onDoubtAvailable = null;
    let onDoubtAssigned = null;
    let onDoubtRated = null;
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
          setIncomingDoubt((prev) => {
            if (prev && String(prev.doubtId) === String(doubtId)) {
              setShowAvailableModal(false);
              return null;
            }
            return prev;
          });
        };

        onDoubtRated = ({ doubtId, rating }) => {
          setToast({
            message: `Asker rated ${rating ? `(${rating}/5)` : ''} and ended session. Doubt ${String(doubtId).slice(-6)}.`,
          });
          setTimeout(() => setToast(null), 5000);
        };

        socket.on('doubt:available', onDoubtAvailable);
        socket.on('doubt:assigned', onDoubtAssigned);
        socket.on('doubt:rated', onDoubtRated);
      }
    } catch {}

    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/solver/available-doubts', {
          headers: { Authorization: `Bearer ${token}` },
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
    }, 15000);

    return () => {
      const socket = socketRef.current;
      if (socket) {
        if (onSocketConnect) socket.off('connect', onSocketConnect);
        if (onDoubtAvailable) socket.off('doubt:available', onDoubtAvailable);
        if (onDoubtAssigned) socket.off('doubt:assigned', onDoubtAssigned);
        if (onDoubtRated) socket.off('doubt:rated', onDoubtRated);
      }
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isSolver, isLoading, sharedSocket, connectSocket, isConnected]);


  const handleAcceptFromModal = async () => {
    if (!incomingDoubt) return;
    try {
      setIsJoiningSession(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/solver/accept-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doubtId: incomingDoubt.doubtId }),
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

      if (incomingDoubt.is_scheduled && incomingDoubt.scheduled_date) {
        setShowAvailableModal(false);
        setIncomingDoubt(null);
        setIsJoiningSession(false);
        alert(
          'Doubt accepted successfully! You will receive an email with the meeting link at the scheduled time.'
        );
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

  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--dash-home-surface)' }}
      >
        <div className="text-center">
          <div
            className="relative mx-auto mb-4 h-12 w-12 rounded-full"
            style={{ border: '4px solid rgba(7,62,54,0.15)', borderTopColor: 'var(--dash-forest)' }}
          >
            <div className="absolute inset-0 animate-spin rounded-full" />
          </div>
          <p className="text-[14px] font-medium text-[var(--dash-text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed right-4 top-4 z-[60] rounded-xl px-4 py-3 text-white shadow-lg" style={{ backgroundColor: 'var(--dash-forest)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-white/80" />
            {toast.message}
          </div>
        </div>
      )}

      {isSolver && showAvailableModal && incomingDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div
              className="rounded-t-xl p-4 text-white"
              style={{ backgroundColor: 'var(--dash-forest)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">New Doubt Available!</h3>
                    <p className="text-xs text-white/80">A new doubt is waiting for you</p>
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
                  className="text-white/80 hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4 text-center">
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--dash-card-mint)' }}
                >
                  <BookOpen className="h-6 w-6 text-[var(--dash-forest)]" />
                </div>
                <h4 className="mb-1 text-lg font-semibold text-[var(--dash-text-body)]">New Doubt Available</h4>
                <p className="text-sm text-[var(--dash-text-muted)]">
                  &quot;{incomingDoubt.subject}&quot; needs your expertise
                </p>
              </div>
              <div
                className="mb-4 rounded-lg p-3"
                style={{ backgroundColor: 'var(--dash-card-mint)' }}
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--dash-forest)]">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">Doubt Details</span>
                </div>
                <div className="space-y-1 text-sm text-[var(--dash-text-muted)]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Subject: {incomingDoubt.subject}</span>
                  </div>
                  {incomingDoubt.is_scheduled && incomingDoubt.scheduled_date && (
                    <div className="mt-1.5 rounded border border-[var(--dash-forest)]/20 bg-white/60 p-1.5 text-xs font-semibold text-[var(--dash-forest)]">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Scheduled:{' '}
                      {new Date(incomingDoubt.scheduled_date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  <p className="line-clamp-2 text-xs">{incomingDoubt.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAcceptFromModal}
                  disabled={isJoiningSession}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--dash-forest)' }}
                >
                  {isJoiningSession ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{incomingDoubt.is_scheduled ? 'Accepting…' : 'Joining Session…'}</span>
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
                  className="w-full rounded-lg border border-[var(--dash-forest)]/25 py-2 text-sm font-medium text-[var(--dash-forest)] hover:bg-[var(--dash-card-mint)]/50 disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DashboardShell
        sidebarItems={sidebarItems}
        topBar={
          <DashboardWelcomeHeader
            userName={user?.name}
            onAskDoubt={() => setAskDoubtOpenSignal((n) => n + 1)}
            onSolveDoubt={() => setShowSolverRequestForm(true)}
          />
        }
      >
        <div
          className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6"
        >
          <DashboardStatCards />
          <div className="flex flex-col gap-3">
            <DashboardWalletCard />
            <DashboardWithdrawTimeline />
          </div>
        </div>
      </DashboardShell>

      <AskDoubt hideTrigger externalOpenSignal={askDoubtOpenSignal} />

      <SolverRequestForm
        isOpen={showSolverRequestForm}
        onClose={() => setShowSolverRequestForm(false)}
        onSuccess={() => {
          setShowSolverRequestForm(false);
          setToast({
            message: 'Solver request submitted successfully! Admin will review your request.',
          });
        }}
      />
    </>
  );
};

export default Dashboard;
