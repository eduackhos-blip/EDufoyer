'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import { buildDashboardSidebarItems } from '../components/dashboardSidebarUtils';
import type { DashboardSidebarItem } from '../components/dashboard/DashboardShell';

type DashboardAuthContextValue = {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  isReady: boolean;
  sidebarItems: DashboardSidebarItem[];
  handleLogout: () => Promise<void>;
  location: {
    pathname: string;
    search: string;
    hash: string;
  };
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const location = useMemo(
    () => ({
      pathname,
      search,
      hash: typeof window !== 'undefined' ? window.location.hash : '',
    }),
    [pathname, search],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/');
          return;
        }
        if (localStorage.getItem('cacheVerified') !== 'true') {
          router.push('/verify-cache');
          return;
        }

        const userData = await authService.getProfile();
        if (!cancelled) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        authService.logout();
        router.push('/');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchUserData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const sidebarItems = useMemo(
    () =>
      buildDashboardSidebarItems({
        user,
        pathname: location.pathname,
        search: location.search,
        onLogout: handleLogout,
      }),
    [user, location.pathname, location.search, handleLogout],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isReady: !isLoading && user !== null,
      sidebarItems,
      handleLogout,
      location,
    }),
    [user, isLoading, sidebarItems, handleLogout, location],
  );

  return <DashboardAuthContext.Provider value={value}>{children}</DashboardAuthContext.Provider>;
}

export function useDashboardAuthContext() {
  const ctx = useContext(DashboardAuthContext);
  if (!ctx) {
    throw new Error('useDashboardAuthContext must be used within DashboardAuthProvider');
  }
  return ctx;
}
