'use client';

import React, { useState } from 'react';
import { Video, User, Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { buildSessionRoomId } from '@/src/lib/session/roomId';

const FOREST = '#073E36';
const STATUS_DOT = '#5FD97A';
const MUTED = '#6b7a76';

const INNER_PANEL_SHADOW =
  '0 2px 8px rgba(7, 62, 54, 0.07), 0 10px 32px rgba(7, 62, 54, 0.12), 0 22px 56px -8px rgba(7, 62, 54, 0.16)';

type SolverAcceptanceNotificationProps = {
  isVisible: boolean;
  onClose: () => void;
  doubtId?: string;
  solverId?: string;
  solverName?: string;
  doubtTitle?: string;
  sessionUrl?: string;
};

export default function SolverAcceptanceNotification({
  isVisible,
  onClose,
  doubtId,
  solverId,
  solverName,
  doubtTitle,
  sessionUrl,
}: SolverAcceptanceNotificationProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const displaySolver = solverName?.trim() || 'Solver';
  const displaySubject = doubtTitle?.trim() || 'Your doubt';

  const handleJoinSession = async () => {
    setIsJoining(true);
    try {
      const target =
        sessionUrl ||
        (solverId && doubtId
          ? `/dashboard/session/${encodeURIComponent(buildSessionRoomId(String(doubtId), String(solverId)))}`
          : null) ||
        (doubtId ? `/dashboard/session/${encodeURIComponent(String(doubtId))}` : '/dashboard');
      router.push(target);
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solver-acceptance-title"
    >
      <div className="animate-fade-in w-full max-w-[44rem] overflow-visible rounded-[22px] bg-white shadow-[0_24px_64px_rgba(7,62,54,0.22)]">
        <div
          className="flex items-center justify-between gap-3 rounded-t-[22px] px-5 py-3.5 md:px-6 md:py-4"
          style={{ backgroundColor: FOREST }}
        >
          <button
            type="button"
            onClick={handleJoinSession}
            disabled={isJoining}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ color: FOREST }}
          >
            <Video className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
            {isJoining ? 'Joining…' : 'Accept and join'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-white/90 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="relative overflow-visible rounded-b-[22px] bg-white px-5 pb-5 pt-10 md:min-h-[15rem] md:px-6 md:pb-6 md:pt-12">
          <div className="relative z-10 w-full md:mt-4 md:w-[62%]">
            <img
              src="/graduationHat.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute z-40 object-contain"
              style={{
                top: '-1.8rem',
                left: '-1.9rem',
                height: '3.5rem',
                width: 'auto',
              }}
              decoding="async"
            />

            <div
              className="relative w-full overflow-visible rounded-[20px] px-4 pb-4 pt-5 text-white md:px-5 md:pb-5 md:pt-6"
              style={{ backgroundColor: FOREST }}
            >
              <div className="mb-2.5 flex items-start gap-2 md:mb-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_DOT }}
                  aria-hidden
                />
                <p
                  id="solver-acceptance-title"
                  className="text-[13px] font-semibold leading-snug md:text-[14px]"
                >
                  Your doubt is accepted by the solver
                </p>
              </div>

              <p className="mb-4 pl-[1.125rem] text-[12px] leading-relaxed md:mb-5 md:pl-5 md:text-[13px]">
                <strong className="font-bold">{displaySubject}</strong> ready to be solved
              </p>

              <div
                className="rounded-[16px] bg-white px-3.5 py-3.5 md:px-4 md:py-4"
                style={{ boxShadow: INNER_PANEL_SHADOW }}
              >
                <p className="mb-2.5 text-[12px] font-bold text-[#1a2e2c] md:mb-3 md:text-[13px]">
                  Session details
                </p>
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 text-[11px] md:text-[12px]"
                    style={{ color: MUTED }}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" strokeWidth={2} aria-hidden />
                    <span>Session is ready to start</span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-[11px] md:text-[12px]"
                    style={{ color: MUTED }}
                  >
                    <User className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" strokeWidth={2} aria-hidden />
                    <span>
                      Solver : <span className="font-medium text-[#1a2e2c]">{displaySolver}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none relative z-20 mt-5 h-[16rem] w-full md:absolute md:inset-y-0 md:left-[55%] md:right-0 md:mt-0 md:h-full md:min-h-[16rem]"
            aria-hidden
          >
            <img
              src="/booksAcceptAndJoin-removebg-preview.png"
              alt=""
              className="select-none object-contain object-center max-md:!left-0 max-md:!top-0"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '16rem',
                minWidth: '15rem',
                position: 'relative',
                top: -2,
                left: '-13rem',
                objectFit: 'contain',
              }}
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
