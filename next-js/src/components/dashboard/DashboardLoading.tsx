'use client';

import React from 'react';

type DashboardLoadingProps = {
  message?: string;
};

export default function DashboardLoading({ message = 'Loading…' }: DashboardLoadingProps) {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--dash-page-bg)' }}
    >
      <div className="text-center">
        <div
          className="relative mx-auto mb-4 h-12 w-12 rounded-full"
          style={{ border: '4px solid rgba(7,62,54,0.15)', borderTopColor: 'var(--dash-forest)' }}
        >
          <div className="absolute inset-0 animate-spin rounded-full" />
        </div>
        <p className="text-[14px] font-medium text-[var(--dash-text-muted)]">{message}</p>
      </div>
    </div>
  );
}
