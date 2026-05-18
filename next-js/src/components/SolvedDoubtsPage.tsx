import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SolvedDoubtsList from './SolvedDoubtsList';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';

const SolvedDoubtsPage = () => {
  const router = useRouter();

  return (
    <DashboardPageLayout loadingMessage="Loading solved doubts…">
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-200 bg-white p-6 transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 max-w-2xl items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex shrink-0 items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden font-medium sm:inline">Back to Dashboard</span>
              </button>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search solved doubts..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <DarkModeToggle />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6 transition-colors duration-300 dark:bg-gray-900">
          <SolvedDoubtsList />
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default SolvedDoubtsPage;
