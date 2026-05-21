'use client';

import React from 'react';
import { CtaArrow } from '../CtaArrow';
import DashboardSplashTitle from './DashboardSplashTitle';

type DashboardWelcomeHeaderProps = {
  userName: string;
  onAskDoubt: () => void;
  onSolveDoubt: () => void;
  showSolveDoubt?: boolean;
};

export default function DashboardWelcomeHeader({
  userName,
  onAskDoubt,
  onSolveDoubt,
  showSolveDoubt = true,
}: DashboardWelcomeHeaderProps) {
  const displayName = (userName || 'User').trim().toUpperCase();

  return (
    <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <DashboardSplashTitle variant="welcome">
        Welcome{' '}
        <span
          className="text-[var(--dash-forest)]"
          style={{
            textShadow:
              '0 3px 8px rgba(7, 62, 54, 0.32), 0 10px 32px rgba(7, 62, 54, 0.22), 0 20px 48px rgba(7, 62, 54, 0.14), 0 1px 0 rgba(7, 62, 54, 0.36)',
          }}
        >
          {displayName}
        </span>{' '}
        !
      </DashboardSplashTitle>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onAskDoubt}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--dash-forest)] bg-white px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--dash-forest)] shadow-[0_4px_14px_rgba(7,62,54,0.08)] transition-opacity hover:opacity-90"
        >
          <CtaArrow tone="forest-dark" />
          Ask doubt
        </button>
        {showSolveDoubt ? (
          <button
            type="button"
            onClick={onSolveDoubt}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--dash-forest)] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(7,62,54,0.18)] transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--dash-forest)' }}
          >
            <CtaArrow tone="white" />
            Solve doubt
          </button>
        ) : null}
      </div>
    </header>
  );
}
