'use client';

import React from 'react';

type DashboardWelcomeHeaderProps = {
  userName: string;
  onAskDoubt: () => void;
  onSolveDoubt: () => void;
  showSolveDoubt?: boolean;
};

function CornerArrow({ className = '' }: { className?: string }) {
  return (
    <img
      src="/aboutus&contactusarrow.png"
      alt=""
      aria-hidden
      className={`h-3.5 w-auto object-contain ${className}`}
      decoding="async"
    />
  );
}

export default function DashboardWelcomeHeader({
  userName,
  onAskDoubt,
  onSolveDoubt,
  showSolveDoubt = true,
}: DashboardWelcomeHeaderProps) {
  const displayName = (userName || 'User').trim().toUpperCase();

  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <h1
        className="relative inline-block text-[clamp(1.35rem,3.2vw,2rem)] font-extrabold uppercase leading-[1.05] tracking-tight text-[var(--dash-forest)]"
        style={{
          textShadow:
            '0 2px 6px rgba(6, 64, 43, 0.22), 0 8px 28px rgba(6, 64, 43, 0.18), 0 16px 40px rgba(6, 64, 43, 0.12), 0 1px 0 rgba(6, 64, 43, 0.28)',
        }}
      >
        <img
          src="/aboveMarks.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute h-5 w-7 object-contain md:h-[3.5rem] md:w-[4rem]"
          style={{ left: '-43px', top: '-31px' }}
          decoding="async"
        />
        Welcome{' '}
        <span
          className="text-[var(--dash-forest)]"
          style={{
            textShadow:
              '0 3px 8px rgba(6, 64, 43, 0.32), 0 10px 32px rgba(6, 64, 43, 0.22), 0 20px 48px rgba(6, 64, 43, 0.14), 0 1px 0 rgba(6, 64, 43, 0.36)',
          }}
        >
          {displayName}
        </span>{' '}
        !
      </h1>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onAskDoubt}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--dash-forest)] bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--dash-forest)] shadow-[0_4px_14px_rgba(7,62,54,0.08)] transition-opacity hover:opacity-90"
        >
          Ask doubt
          <CornerArrow />
        </button>
        {showSolveDoubt ? (
          <button
            type="button"
            onClick={onSolveDoubt}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--dash-forest)] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(7,62,54,0.18)] transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--dash-forest)' }}
          >
            Solve doubt
            <CornerArrow className="brightness-0 invert" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
