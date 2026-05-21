'use client';

import { Calendar, Clock, Star, User } from 'lucide-react';

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return 'th';
  const last = day % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
}

function formatSolvedDate(dateValue?: string | null) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.toLocaleDateString('en-IN', { month: 'long' });
  const year = d.getFullYear();
  return `Solved on ${day}${ordinalSuffix(day)} ${month} ${year}`;
}

function formatSolvedTime(dateValue?: string | null) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

type SolvedDoubtCardProps = {
  subject?: string;
  description?: string;
  studentName?: string;
  resolvedAt?: string | null;
  rating?: number;
};

export default function SolvedDoubtCard({
  subject = 'Untitled doubt',
  description = '',
  studentName = 'Unknown Student',
  resolvedAt,
  rating = 0,
}: SolvedDoubtCardProps) {
  const safeRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <article className="doubt-card-solved h-full">
      <div className="doubt-card-solved__inner flex h-full min-h-[11.5rem] flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug text-[#073E36]">{subject}</h3>
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#073E36] px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Completed
          </span>
        </div>

        {description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--dash-text-body)]">{description}</p>
        ) : (
          <p className="mb-4 text-sm text-[var(--dash-text-muted)]">No description provided.</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5 text-xs text-[var(--dash-text-body)]">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0 text-[var(--dash-forest)]" aria-hidden />
              <span className="truncate font-medium">{studentName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--dash-forest)]" aria-hidden />
              <span>{formatSolvedDate(resolvedAt)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--dash-forest)]" aria-hidden />
              <span>{formatSolvedTime(resolvedAt)}</span>
            </span>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5"
            aria-label={`Rating ${safeRating} out of 5`}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < safeRating
                      ? 'fill-[#073E36] text-[#073E36]'
                      : 'fill-none text-[#b8c4a8]'
                  }`}
                  strokeWidth={i < safeRating ? 0 : 1.5}
                  aria-hidden
                />
              ))}
            </div>
            <span className="text-xs font-semibold leading-none text-[#073E36]">{safeRating}/5</span>
          </div>
        </div>
      </div>
    </article>
  );
}
