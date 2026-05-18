import React, { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import EducationalFeed from './EducationalFeed';
import FriendCircle from './FriendCircle';

const EducationalSocial = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');

  return (
    <DashboardPageLayout loadingMessage="Loading…">
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 max-w-2xl items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex shrink-0 items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search educational content, friends, and subjects..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['feed', 'friends'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {tab === 'feed' ? 'Feed' : 'Friend Circle'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === 'feed' ? <EducationalFeed /> : <FriendCircle />}
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default EducationalSocial;
