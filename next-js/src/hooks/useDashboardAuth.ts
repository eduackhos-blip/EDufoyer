'use client';

import { useRouter } from 'next/navigation';
import { useDashboardAuthContext } from '../contexts/DashboardAuthContext';

/** Dashboard auth + sidebar — loaded once per dashboard session via DashboardAuthProvider. */
export function useDashboardAuth() {
  const router = useRouter();
  const { user, isLoading, isReady, sidebarItems, handleLogout, location } =
    useDashboardAuthContext();

  return {
    user,
    isLoading,
    isReady,
    sidebarItems,
    handleLogout,
    router,
    location,
  };
}
