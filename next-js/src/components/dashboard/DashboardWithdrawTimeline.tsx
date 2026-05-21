'use client';

import React from 'react';
import { BookOpen, Check, IndianRupee } from 'lucide-react';

function CardArrow() {
  return (
    <img
      src="/aboutus&contactusarrow.png"
      alt=""
      aria-hidden
      className="h-3.5 w-auto object-contain"
      decoding="async"
    />
  );
}

const STEPS = [
  {
    title: 'Withdraw requested',
    body: 'Withdraw request accepted!',
    dateLine1: 'May 12, 2026',
    dateLine2: '10:00 AM',
    badge: 'Completed',
    variant: 'done' as const,
    Icon: Check,
  },
  {
    title: 'Request Approval',
    body: 'Your request is being reviewed',
    dateLine1: 'May 15, 2026',
    dateLine2: '13:40 PM',
    badge: 'In progress',
    variant: 'active' as const,
    Icon: BookOpen,
  },
  {
    title: 'Money credited',
    body: 'Your money will be credited once approved',
    dateLine1: '',
    dateLine2: '',
    badge: 'Pending',
    variant: 'pending' as const,
    Icon: IndianRupee,
  },
];

function StepBadge({ variant, label }: { variant: 'done' | 'active' | 'pending'; label: string }) {
  const base = 'shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide';
  if (variant === 'done') {
    return <span className={`${base} bg-white text-[var(--dash-forest)]`}>{label}</span>;
  }
  return (
    <span className={`${base} border border-[var(--dash-forest)]/15 bg-white text-[var(--dash-forest)]`}>
      {label}
    </span>
  );
}

export default function DashboardWithdrawTimeline() {
  return (
    <article className="dash-panel-card dash-panel-card--tile-shadow p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--dash-text-body)]">Withdraw status</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(6,64,43,0.2)]"
            style={{ backgroundColor: 'var(--dash-forest)' }}
          >
            History
            <img
              src="/aboutus&contactusarrow.png"
              alt=""
              aria-hidden
              className="h-2.5 w-auto -scale-x-100 brightness-0 invert"
            />
          </button>
          <CardArrow />
        </div>
      </div>

      <ol className="relative space-y-0 pl-0.5">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          const cardBg =
            step.variant === 'done'
              ? 'var(--dash-forest)'
              : step.variant === 'active'
                ? 'var(--dash-card-mint)'
                : 'var(--dash-card-pending-bg)';
          const textClass =
            step.variant === 'done' ? 'text-white' : 'text-[var(--dash-forest)]';
          const mutedClass =
            step.variant === 'done' ? 'text-white/80' : 'text-[var(--dash-text-muted)]';
          const cardBorder =
            step.variant === 'active' ? '2px solid var(--dash-forest)' : '2px solid transparent';

          return (
            <li key={step.title} className="relative flex gap-2.5 pb-3 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[1rem] top-9 bottom-0 w-0 border-l-2 border-dashed border-[var(--dash-forest)]/20"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.variant === 'done'
                    ? 'text-white'
                    : step.variant === 'pending'
                      ? 'bg-[var(--dash-progress-track)] text-[var(--dash-forest)]'
                      : 'bg-white text-[var(--dash-forest)] shadow-sm'
                }`}
                style={
                  step.variant === 'done'
                    ? { backgroundColor: 'var(--dash-forest)' }
                    : step.variant === 'active'
                      ? { border: '2px solid var(--dash-card-mint-alt)' }
                      : undefined
                }
              >
                <step.Icon className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div
                className={`min-w-0 flex-1 rounded-[14px] px-3 py-2.5 ${textClass}`}
                style={{ backgroundColor: cardBg, border: cardBorder }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-bold">{step.title}</p>
                      {step.variant !== 'pending' ? (
                        <StepBadge variant={step.variant} label={step.badge} />
                      ) : null}
                    </div>
                    <p className={`text-[12px] font-medium leading-snug ${mutedClass}`}>{step.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {step.variant === 'pending' ? (
                      <StepBadge variant={step.variant} label={step.badge} />
                    ) : null}
                    {step.dateLine1 ? (
                      <div className={`text-right text-[11px] leading-tight ${mutedClass}`}>
                        <p>{step.dateLine1}</p>
                        {step.dateLine2 ? <p>{step.dateLine2}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
