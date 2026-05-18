'use client';

import React from 'react';
import { SquarePlus } from 'lucide-react';

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

export default function DashboardWalletCard() {
  return (
    <article className="dash-panel-card p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[var(--dash-text-body)]">Your Wallet</h2>
        <CardArrow />
      </div>

      <div
        className="relative mb-3 min-h-[6.25rem] overflow-hidden rounded-[16px] px-4 py-3.5"
        style={{ backgroundColor: 'var(--dash-card-mint)' }}
      >
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 object-contain"
        />
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-3 top-3 h-4 w-4 object-contain"
        />
        <div className="flex items-center gap-3.5">
          <img
            src="/walletImageDashboard.png"
            alt=""
            aria-hidden
            className="h-[4.25rem] w-auto shrink-0 object-contain"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[var(--dash-forest)]">Current balance</p>
            <p className="text-[2rem] font-extrabold leading-none tracking-tight text-[var(--dash-forest)]">
              ₹ 100
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[var(--dash-forest)]">
            <span>Total earned</span>
            <span>₹ 100</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--dash-progress-track)]">
            <div className="h-full w-full rounded-full" style={{ backgroundColor: 'var(--dash-forest)' }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[var(--dash-forest)]">
            <span>Withdrawn</span>
            <span>₹ 50</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--dash-progress-track)]">
            <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: 'var(--dash-forest)' }} />
          </div>
        </div>
      </div>

      <div className="mb-2 border-t border-[var(--dash-forest)]/10 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-bold text-white shadow-[0_4px_14px_rgba(6,64,43,0.2)]"
          style={{ backgroundColor: 'var(--dash-forest)' }}
        >
          <SquarePlus className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
          Withdraw
        </button>
      </div>
      <p className="text-center text-[10px] font-medium text-[var(--dash-text-muted)]">
        To withdraw rating above 3.5
      </p>
    </article>
  );
}
