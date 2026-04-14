import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Menu } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import SolvedDoubtsList from './SolvedDoubtsList';
import DarkModeToggle from './DarkModeToggle';
import SharedSidebar from './SharedSidebar';
import { buildDashboardSidebarItems } from './dashboardSidebarUtils';
import { DashboardSidebarSuggested, DashboardSidebarUserFooter } from './DashboardSidebarExtras';

const SolvedDoubtsPage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const handleHelpSupport = () => router.push('/contact');

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SharedSidebar
          items={sidebarItems}
          onClose={() => setIsSidebarOpen(false)}
          showCloseButton={true}
          belowNav={<DashboardSidebarSuggested />}
          footer={
            <DashboardSidebarUserFooter
              user={user}
              onLogout={handleLogout}
              onHelpSupport={handleHelpSupport}
            />
          }
        />
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden lg:ml-0">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-2xl min-w-0">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                onClick={() => setIsSidebarOpen((o) => !o)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search solved doubts..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <DarkModeToggle />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <SolvedDoubtsList />
        </div>
      </div>
    </div>
  );
};

export default SolvedDoubtsPage;
