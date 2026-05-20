'use client';

import { Clock, MessageCircle } from 'lucide-react';

function formatCardDate(dateValue?: string | null) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTimeAgo(dateValue?: string | null) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN');
}

function getStatusLabel(doubt: {
  status?: string;
  solverDoubt?: { feedback_comment?: string | null };
}) {
  const answerText = doubt.solverDoubt?.feedback_comment;
  const hasAnswer =
    answerText !== undefined && answerText !== null && String(answerText).trim() !== '';

  if (hasAnswer) return 'New Answer';
  if (doubt.status === 'resolved' || doubt.status === 'closed') return 'Completed';
  if (doubt.status === 'assigned') return 'Assigned';
  return 'Pending';
}

export type MyDoubtCardViewPayload = {
  doubtId: string;
  solverName: string;
  questionText: string;
  answerText: string;
  timeLabel: string;
};

type MyDoubtCardProps = {
  doubt: {
    _id: string;
    subject?: string;
    description?: string;
    status?: string;
    createdAt?: string;
    solver?: { name?: string };
    solverDoubt?: { feedback_comment?: string | null; resolved_at?: string | null };
  };
  onViewAnswer?: (payload: MyDoubtCardViewPayload) => void;
};

export default function MyDoubtCard({ doubt, onViewAnswer }: MyDoubtCardProps) {
  const answerText = doubt.solverDoubt?.feedback_comment;
  const hasAnswer =
    answerText !== undefined && answerText !== null && String(answerText).trim() !== '';
  const solverName = (doubt.solver?.name || 'Solver').trim() || 'Solver';
  const question = doubt.description || '';
  const statusLabel = getStatusLabel(doubt);
  const timeAgo = formatTimeAgo(doubt.solverDoubt?.resolved_at || doubt.createdAt);
  const isNewAnswer = statusLabel === 'New Answer';

  return (
    <article className="doubt-card-my flex h-full flex-col">
      <div className="doubt-card-my__inner flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug text-[#073E36]">
            {doubt.subject || 'Untitled doubt'}
          </h3>
          <span className="shrink-0 text-xs font-medium text-[var(--dash-text-muted)]">
            {formatCardDate(doubt.createdAt)}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--dash-text-body)]">
          {question || 'No description provided.'}
        </p>

        <span
          className={`mb-3 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${
            isNewAnswer
              ? 'bg-[var(--dash-card-mint)] text-[var(--dash-forest)]'
              : 'bg-[#073E36] text-white'
          }`}
        >
          {statusLabel}
        </span>

        {doubt.solver?.name ? (
          <p className="mb-3 text-xs font-medium text-[var(--dash-text-body)]">
            {hasAnswer ? (
              <>
                <span className="font-bold text-[#073E36]">{solverName}</span> answered your question
              </>
            ) : (
              <>Solver: {solverName}</>
            )}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-[var(--dash-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {timeAgo}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hasAnswer ? '1' : '0'}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() =>
            onViewAnswer?.({
              doubtId: doubt._id,
              solverName,
              questionText: question,
              answerText: hasAnswer ? String(answerText) : 'Awaiting answer from solver.',
              timeLabel: timeAgo,
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#073E36] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90"
        >
          View answer
        </button>
      </div>
    </article>
  );
}
