'use client';

import React from 'react';
import DashboardShell from './DashboardShell';
import DashboardContentLoading from './DashboardContentLoading';
import { useDashboardAuth } from '../../hooks/useDashboardAuth';

type DashboardPageLayoutProps = {
  children: React.ReactNode;
  contentVariant?: 'card' | 'plain';
  loadingMessage?: string;
  topBar?: React.ReactNode;
  /** When true, show content loading inside shell instead of children */
  contentLoading?: boolean;
};

export default function DashboardPageLayout({
  children,
  contentVariant = 'plain',
  loadingMessage,
  topBar,
  contentLoading = false,
}: DashboardPageLayoutProps) {
  const { isLoading: authLoading, sidebarItems } = useDashboardAuth();

  const mainContent =
    authLoading || contentLoading ? (
      <DashboardContentLoading message={loadingMessage} />
    ) : (
      children
    );

  return (
    <DashboardShell sidebarItems={sidebarItems} contentVariant={contentVariant} topBar={topBar}>
      {mainContent}
    </DashboardShell>
  );
}
