import React from 'react';
import { Clock, Eye, MessageCircle, Video } from 'lucide-react';
import { DoubtStatusBadge, ResolutionStatusBadge } from './StatusBadges';

const getTimeStatus = (status, createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();

  if (status === 'resolved' || status === 'closed') {
    return 'Completed';
  }

  const diffTime = now.getTime() - created.getTime();
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffHours >= 1) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes >= 1) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const DoubtCard = ({
  doubt,
  type,
  onAcceptDoubt,
  onJoinSession,
}) => {
  const isSessionReady = type === 'assigned' && doubt.solverDoubt?.resolution_status === 'session_scheduled';
  const isAvailable = type === 'available';

  const formatCardDate = (dateValue) => {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  if (isAvailable) {
    return (
      <article className="doubt-card-available flex h-full flex-col">
        <div className="doubt-card-available__inner flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-snug text-[#073E36]">{doubt.subject}</h3>
            <span className="shrink-0 text-xs font-medium text-[var(--dash-text-muted)]">
              {formatCardDate(doubt.createdAt)}
            </span>
          </div>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--dash-text-body)]">
            {doubt.description}
          </p>
          <span className="mb-4 inline-flex w-fit rounded-full bg-[#073E36] px-3 py-1 text-[11px] font-semibold text-white">
            Available
          </span>
          <div className="mt-auto flex w-full items-center justify-between gap-2 text-xs text-[var(--dash-text-muted)]">
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {getTimeStatus(doubt.status, doubt.createdAt)}
            </span>
            <div className="ml-auto inline-flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {doubt.views || 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {doubt.answers?.length || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onAcceptDoubt?.(doubt._id)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#073E36] px-4 py-1.5 text-sm font-semibold leading-tight text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90"
          >
            <Video className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            Accept and join
          </button>
        </div>
      </article>
    );
  }

  const resolutionStatus = doubt.solverDoubt?.resolution_status;
  const statusLabel =
    resolutionStatus === 'session_scheduled'
      ? 'Session scheduled'
      : resolutionStatus
        ? String(resolutionStatus).replace(/_/g, ' ')
        : 'Assigned';

  return (
    <article className="doubt-card-assigned flex h-full flex-col">
      <div className="doubt-card-assigned__inner flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug text-[#073E36]">{doubt.subject}</h3>
          <span className="shrink-0 text-xs font-medium text-[var(--dash-text-muted)]">
            {formatCardDate(doubt.createdAt)}
          </span>
        </div>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--dash-text-body)]">
          {doubt.description}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DoubtStatusBadge status={doubt.status} />
          {doubt.solverDoubt ? (
            <ResolutionStatusBadge status={doubt.solverDoubt.resolution_status} />
          ) : (
            <span className="inline-flex w-fit rounded-full bg-[#073E36] px-3 py-1 text-[11px] font-semibold capitalize text-white">
              {statusLabel}
            </span>
          )}
        </div>
        <div className="mt-auto flex w-full items-center justify-between gap-2 text-xs text-[var(--dash-text-muted)]">
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {getTimeStatus(doubt.status, doubt.createdAt)}
          </span>
          <div className="ml-auto inline-flex shrink-0 items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {doubt.views || 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {doubt.answers?.length || 0}
            </span>
          </div>
        </div>
      </div>
      {isSessionReady ? (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onJoinSession?.(doubt._id)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#073E36] px-4 py-1.5 text-sm font-semibold leading-tight text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90"
          >
            <Video className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            Join session
          </button>
        </div>
      ) : null}
    </article>
  );
};

export default DoubtCard;

