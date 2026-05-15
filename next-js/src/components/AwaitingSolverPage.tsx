import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Bell, BookOpen, Check, Clock, Flag, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import notificationService from '../services/notificationService';
import doubtService from '../services/doubtService';
import SolverAcceptanceNotification from './SolverAcceptanceNotification';
import { useSocket } from '../contexts/SocketContext';

const PAGE_BG = '#ffffff';
const FOREST = '#073E36';
const CARD_SAGE = '#E6EDD7';

const CATEGORY_LABELS: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large'
};

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <span className="relative inline-block pt-[6px] text-[15px] font-bold tracking-tight text-[#1a2e2c]">
        <img
          src="/aboveMarks.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-[-17px] top-0 h-[18px] w-[24px] object-contain"
          decoding="async"
        />
        {children}
      </span>
    </div>
  );
}

/** Hero art: waiting-room line art (asset in /public). */
function WaitingRoomIllustration() {
  return (
    <img
      src="/waitingRoomImage.png"
      alt=""
      aria-hidden
      className="pointer-events-none h-auto max-h-[10.5rem] w-auto max-w-[min(88vw,17rem)] shrink-0 select-none object-contain object-bottom md:max-h-[12.5rem] md:max-w-[20rem]"
      decoding="async"
    />
  );
}

function RoomTitleMarks() {
  return (
    <span className="absolute -top-[12px] left-0 flex gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-[10px] w-[2px] rounded-full bg-white/90"
          style={{ transform: `rotate(${-18 + i * 18}deg)` }}
        />
      ))}
    </span>
  );
}

/** Curved dotted connectors between three step nodes (matches mock). */
function HowItWorksTrack() {
  return (
    <div className="relative px-1 pb-1 pt-2">
      <svg
        className="pointer-events-none absolute left-2 right-2 top-[22px] h-[52px] w-[calc(100%-16px)] text-[#a8bdb4]"
        viewBox="0 0 260 52"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M 38 26 Q 68 46 98 26"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeDasharray="4 6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 162 26 Q 192 46 222 26"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeDasharray="4 6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="relative z-[1] flex justify-between gap-2">
        {[
          { Icon: Check, active: true, label: 'Step 1' },
          { Icon: BookOpen, active: false, label: 'Step 2' },
          { Icon: Flag, active: false, label: 'Step 3' }
        ].map(({ Icon, active, label }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-full shadow-md ${
                active ? 'bg-[#073E36]' : 'bg-[#dfe6e3]'
              }`}
            >
              <Icon className={`h-[22px] w-[22px] ${active ? 'text-white' : 'text-[#6b7a76]'}`} strokeWidth={active ? 2.6 : 2.2} />
            </div>
            <span
              className={`text-center text-[11px] font-bold tracking-tight ${
                active ? 'text-[#073E36]' : 'text-[#6b7a76]'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatSubjectLabel(subject: string | undefined) {
  if (!subject || !String(subject).trim()) return 'Unknown';
  return String(subject)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const AwaitingSolverPage = () => {
  const params = useParams();
  const doubtId = (Array.isArray(params.doubtId) ? params.doubtId[0] : params.doubtId) as string;
  const router = useRouter();
  const [doubt, setDoubt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showAcceptanceNotification, setShowAcceptanceNotification] = useState(false);
  const [solverInfo, setSolverInfo] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const socketRef = useRef(null);
  const { socket: sharedSocket, connectSocket } = useSocket();

  const formatTimeElapsed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const fetchDoubtDetails = async () => {
    try {
      const response = await doubtService.getDoubtById(doubtId);
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
      setDoubt(doubtData);
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

  const fetchNotifications = async () => {
    try {
      const notificationData = await notificationService.getNotifications();
      let list: unknown[] = [];
      if (Array.isArray(notificationData)) {
        list = notificationData;
      } else if (notificationData && Array.isArray((notificationData as { data?: unknown[] }).data)) {
        list = (notificationData as { data: unknown[] }).data;
      } else if (
        notificationData &&
        Array.isArray((notificationData as { notifications?: unknown[] }).notifications)
      ) {
        list = (notificationData as { notifications: unknown[] }).notifications;
      }
      setNotifications(list as never[]);
      const assignmentNotification = (list as { doubt_id?: string; message_type?: string }[]).find(
        (n) => n.doubt_id === doubtId && n.message_type === 'DOUBT_ASSIGNED'
      );
      if (assignmentNotification) {
        setSolverInfo({
          name: 'Solver',
          doubtTitle: doubt?.subject || 'Your doubt'
        });
        setShowAcceptanceNotification(true);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDoubtDetails(), fetchNotifications()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw this doubt? You can submit a new doubt later.')) return;
    setWithdrawing(true);
    try {
      await doubtService.deleteDoubt(doubtId);
      router.push('/dashboard/doubts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not withdraw doubt.';
      alert(msg);
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [doubtId]);

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

  useEffect(() => {
    if (!doubt?.subject) return;
    let onDoubtAssigned: ((p: { doubtId: string }) => void) | null = null;
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
    } catch {
      /* socket optional */
    }
    return () => {
      if (socketRef.current && onDoubtAssigned) {
        socketRef.current.off('doubt:assigned', onDoubtAssigned);
      }
      socketRef.current = null;
    };
  }, [doubtId, doubt?.subject, sharedSocket, connectSocket]);

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

  const categoryKey = String(doubt?.category || '').toLowerCase();
  const categoryDisplay = CATEGORY_LABELS[categoryKey] || doubt?.category || '—';

  const doubtNotification = notifications.filter((n: { doubt_id?: string }) => n.doubt_id === doubtId)[0] as
    | { content?: string; createdAt?: string }
    | undefined;

  const liveText =
    doubtNotification?.content ||
    `Your doubt "${doubt?.subject || 'your subject'}" has been submitted successfully and is awaiting a solver.`;

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center px-[2%] transition-colors"
        style={{ backgroundColor: PAGE_BG, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#073E36]/25 border-t-[#073E36]"
            aria-hidden
          />
          <p className="text-[15px] text-[#1a2e2c]/80">Loading doubt details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center px-[2%] transition-colors"
        style={{ backgroundColor: PAGE_BG, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="max-w-md rounded-2xl border border-[#073E36]/15 bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-[#1a2e2c]">Error loading doubt</h3>
          <p className="mb-6 text-[14px] text-[#4b5c57]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#073E36] px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: PAGE_BG, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex w-full max-w-none items-start gap-3 px-[2%] pb-12 pt-4 md:gap-4">
        <div className="flex shrink-0 flex-col pt-[0.65rem] md:pt-[0.7rem]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-900/[0.07]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
          <header className="flex min-h-[52px] w-full items-center justify-between rounded-[18px] border border-[#073E36]/18 bg-[#d8e8cc] px-4 py-3 shadow-sm md:px-6">
            <Link href="/" className="edu-logo shrink-0" aria-label="Edufoyer home">
              <span className="edu-logo-text">EDU</span>
              <span className="edu-logo-f">F</span>
              <span className="edu-logo-text">OYER</span>
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: FOREST }}
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.2} aria-hidden />
              <span>REFRESH</span>
            </button>
          </header>

          <section className="relative overflow-hidden rounded-[22px] bg-[#073E36] px-5 py-6 shadow-[0_18px_50px_rgba(7,62,54,0.22)] md:rounded-[26px] md:px-8 md:py-8">
          {/* Base stays #073E36; overlays are neutral (white) so the section reads as your brand green */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -32deg,
                transparent,
                transparent 6px,
                rgba(255,255,255,0.11) 6px,
                rgba(255,255,255,0.11) 7px
              )`
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              backgroundImage: `radial-gradient(ellipse 75% 55% at 92% 8%, rgba(255,255,255,0.14) 0%, transparent 55%),
                radial-gradient(ellipse 65% 50% at 6% 92%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }}
          />

          <div className="absolute right-4 top-4 z-[2] md:right-6 md:top-5">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-neutral-900 shadow-md md:text-[12px]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-900" strokeWidth={2.4} aria-hidden />
              <span>
                Time elapsed : {formatTimeElapsed(timeElapsed)}
              </span>
            </div>
          </div>

          <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-6 md:pr-2">
            <div className="max-w-xl pt-6 md:pt-5">
              <div className="flex flex-wrap items-center gap-5">
                <div
                  className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border-[3px] border-white/35 bg-white/10 shadow-inner"
                  aria-hidden
                >
                  <div className="h-[2.85rem] w-[2.85rem] animate-spin rounded-full border-[3px] border-white/25 border-t-white border-r-white/40" />
                </div>
                <div>
                  <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight text-white md:text-[36px]">
                    <span className="relative inline-block font-bold">
                      <RoomTitleMarks />
                      Waiting
                    </span>{' '}
                    <span className="inline-block font-bold">Room</span>
                  </h1>
                  <p className="mt-2 max-w-md text-[13px] leading-snug text-white/55 md:text-[15px]">
                    Your doubt is waiting for a solver to accept it
                  </p>
                </div>
              </div>
            </div>
            <div
              className="flex justify-center pb-1 md:block md:justify-end md:pb-0 md:pr-2"
              style={{ position: 'relative', bottom: '-52px', right: '14px' }}
            >
              <WaitingRoomIllustration />
            </div>
          </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(280px,1fr)]">
          <div className="flex flex-col gap-6">
            <div
              className="rounded-[22px] border border-[#073E36]/14 p-4 shadow-[0_10px_36px_rgba(7,62,54,0.08)] md:p-5"
              style={{ backgroundColor: CARD_SAGE }}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <SectionTitle>Doubt details</SectionTitle>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="shrink-0 rounded-full bg-[#073E36] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {withdrawing ? 'Withdrawing…' : 'Withdraw request'}
                </button>
              </div>
              <div className="rounded-[18px] border border-[#073E36]/10 bg-white p-4 shadow-[0_4px_22px_rgba(7,62,54,0.06)] md:p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#4b5c57]">Subject</span>
                  <span className="rounded-full bg-[#073E36] px-3 py-1 text-[12px] font-semibold text-white">
                    {formatSubjectLabel(doubt?.subject)}
                  </span>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#4b5c57]">Category</span>
                  <span className="rounded-full bg-[#073E36] px-3 py-1 text-[12px] font-semibold text-white">
                    {categoryDisplay}
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-[#4b5c57]">Description</p>
                  <div className="min-h-[72px] rounded-[14px] border border-[#c5d5cf] bg-[#f7faf6] px-3 py-2.5 text-[13px] leading-relaxed text-[#1a2e2c]">
                    {doubt?.description || 'Description unavailable'}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-[22px] border border-[#073E36]/14 p-4 shadow-[0_10px_36px_rgba(7,62,54,0.08)] md:p-5"
              style={{ backgroundColor: CARD_SAGE }}
            >
              <SectionTitle icon={<Bell className="h-4 w-4 text-[#073E36]" strokeWidth={2.2} aria-hidden />}>
                Live updates
              </SectionTitle>
              <div className="rounded-[16px] border border-[#073E36]/12 bg-[#ecf4e4] px-4 py-3.5 shadow-inner">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#073E36]" />
                  <p className="text-[13px] leading-snug text-[#1a2e2c]">{liveText}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div
              className="rounded-[22px] border border-[#073E36]/14 p-4 shadow-[0_10px_36px_rgba(7,62,54,0.08)] md:p-5"
              style={{ backgroundColor: CARD_SAGE }}
            >
              <SectionTitle>How it works</SectionTitle>
              <div className="rounded-[18px] border border-[#073E36]/10 bg-white p-3 shadow-[0_4px_22px_rgba(7,62,54,0.06)] md:p-4">
                <HowItWorksTrack />
              </div>
            </div>

            <div
              className="rounded-[22px] border border-[#073E36]/14 p-4 shadow-[0_10px_36px_rgba(7,62,54,0.08)] md:p-5"
              style={{ backgroundColor: CARD_SAGE }}
            >
              <SectionTitle>Process</SectionTitle>
              <div className="rounded-[18px] border border-[#073E36]/10 bg-white p-4 shadow-[0_4px_22px_rgba(7,62,54,0.06)] md:p-5">
                <ol className="space-y-5">
                  <li className="flex gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{ backgroundColor: FOREST }}
                    >
                      1
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#073E36]">Solver Notification</p>
                      <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#073E36]">
                        Your query has been submitted successfully
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfe6e3] text-[12px] font-bold text-[#6b7a76]">
                      2
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a2e2c]">Mentor notification</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#6b7a76]">
                        Solver is here to help you with lore ipsum
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfe6e3] text-[12px] font-bold text-[#6b7a76]">
                      3
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a2e2c]">Session ready</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#6b7a76]">
                        You can join after accept/join in the popup
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

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
