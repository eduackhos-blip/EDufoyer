'use client';

import React from 'react';

type DashboardContentLoadingProps = {
  message?: string;
  className?: string;
};

export default function DashboardContentLoading({
  message = 'Loading…',
  className = '',
}: DashboardContentLoadingProps) {
  return (
    <div
      className={`flex min-h-[16rem] flex-1 items-center justify-center ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="relative mx-auto mb-4 h-10 w-10 rounded-full"
          style={{ border: '4px solid rgba(7,62,54,0.15)', borderTopColor: 'var(--dash-forest)' }}
        >
          <div className="absolute inset-0 animate-spin rounded-full" />
        </div>
        <p className="text-[14px] font-medium text-[var(--dash-text-muted)]">{message}</p>
      </div>
    </div>
  );
}
