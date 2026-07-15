'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import { buildDashboardSidebarItems } from '../components/dashboardSidebarUtils';

export function useDashboardAuth() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const location = useMemo(
    () => ({
      pathname,
      search: searchParams.toString() ? `?${searchParams.toString()}` : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
    }),
    [pathname, searchParams],
  );

  useEffect(() => {
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
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        authService.logout();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  return { user, isLoading, sidebarItems, handleLogout, router, location };
}
