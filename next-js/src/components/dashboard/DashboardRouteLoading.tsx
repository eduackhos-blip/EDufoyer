'use client';

import React from 'react';
import DashboardPageLayout from './DashboardPageLayout';
import DashboardContentLoading from './DashboardContentLoading';

/** Shown during Next.js route transitions under /dashboard — keeps shell when auth is ready. */
export default function DashboardRouteLoading() {
  return (
    <DashboardPageLayout loadingMessage="Loading…">
      <DashboardContentLoading message="Loading…" />
    </DashboardPageLayout>
  );
}
