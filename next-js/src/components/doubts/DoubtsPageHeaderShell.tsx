'use client';

import React from 'react';
import DashboardSplashTitle from '../dashboard/DashboardSplashTitle';

type DoubtsPageHeaderShellProps = {
  title: string;
  actions: React.ReactNode;
  className?: string;
};

export default function DoubtsPageHeaderShell({ title, actions, className = '' }: DoubtsPageHeaderShellProps) {
  return (
    <header className={`dash-page-header mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5 ${className}`}>
      <DashboardSplashTitle variant="page">{title}</DashboardSplashTitle>
      <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
    </header>
  );
}
