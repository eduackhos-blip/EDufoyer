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
          <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-[var(--dash-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {getTimeStatus(doubt.status, doubt.createdAt)}
            </span>
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
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onAcceptDoubt?.(doubt._id)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#073E36] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90"
          >
            <Video className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            Accept and join
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="mb-2 break-words text-lg font-semibold text-gray-800 dark:text-gray-100">
            {doubt.subject}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 break-words break-all overflow-hidden transition-colors duration-300">
            {doubt.description}
          </p>
        </div>
        <div className="ml-4 flex flex-col items-end space-y-2">
          <DoubtStatusBadge status={doubt.status} />
          {doubt.solverDoubt && (
            <ResolutionStatusBadge status={doubt.solverDoubt.resolution_status} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {getTimeStatus(doubt.status, doubt.createdAt)}
          </span>
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {doubt.views || 0}
          </span>
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {doubt.answers?.length || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {isSessionReady && (
            <button
              onClick={() => onJoinSession?.(doubt._id)}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Session
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-300">
          {new Date(doubt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default DoubtCard;

