'use client';

import React from 'react';
import DashboardShell from './DashboardShell';
import DashboardLoading from './DashboardLoading';
import { useDashboardAuth } from '../../hooks/useDashboardAuth';

type DashboardPageLayoutProps = {
  children: React.ReactNode;
  contentVariant?: 'card' | 'plain';
  loadingMessage?: string;
  topBar?: React.ReactNode;
};

export default function DashboardPageLayout({
  children,
  contentVariant = 'plain',
  loadingMessage,
  topBar,
}: DashboardPageLayoutProps) {
  const { isLoading, sidebarItems } = useDashboardAuth();

  if (isLoading) {
    return <DashboardLoading message={loadingMessage} />;
  }

  return (
    <DashboardShell sidebarItems={sidebarItems} contentVariant={contentVariant} topBar={topBar}>
      {children}
    </DashboardShell>
  );
}
