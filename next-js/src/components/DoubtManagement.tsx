// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { MessageCircle, Eye, XCircle, ArrowLeft, X } from 'lucide-react';
import DoubtCard from './DoubtCard';
import doubtService from '../services/doubtService';
import solverService from '../services/solverService';
import authService from '../services/authService';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import DashboardContentLoading from './dashboard/DashboardContentLoading';
import AssignedDoubtsSection from './AssignedDoubtsSection';
import AvailableDoubtsSection from './AvailableDoubtsSection';
import AvailableDoubtsPageHeader from './doubts/AvailableDoubtsPageHeader';
import MyDoubtsPageHeader from './doubts/MyDoubtsPageHeader';
import MyDoubtsSection from './MyDoubtsSection';
const DOUBT_TABS = [
  { id: 'my-doubts', label: 'My Doubts' },
  { id: 'available', label: 'Available' },
  { id: 'assigned', label: 'Assigned' },
];

function parseDoubtsTab(tabFromUrl) {
  if (tabFromUrl === 'available' || tabFromUrl === 'assigned' || tabFromUrl === 'my-doubts') {
    return tabFromUrl;
  }
  return 'available';
}

const DoubtManagement = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => parseDoubtsTab(tabFromUrl));
  const [myDoubts, setMyDoubts] = useState([]);
  const [availableDoubts, setAvailableDoubts] = useState([]);
  const [assignedDoubts, setAssignedDoubts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewAnswerModal, setViewAnswerModal] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);

  const fetchMyDoubts = async () => {
    try {
      console.log('🔄 Fetching my doubts...');
      const data = await doubtService.getMyDoubts();
      console.log('📊 Received doubt data:', data);
      console.log('📝 Number of doubts:', data.doubts?.length || 0);

      const doubts = data.doubts || [];
      console.log('🗓️ Doubt date fields (shape check):', doubts.map((d) => ({
        id: d?._id,
        createdAt: d?.createdAt,
        resolvedAt: d?.solverDoubt?.resolved_at,
        status: d?.status,
        hasSolver: Boolean(d?.solver),
        solverName: d?.solver?.name,
        hasSolverDoubt: Boolean(d?.solverDoubt),
        feedbackComment: d?.solverDoubt?.feedback_comment
      })));

      setMyDoubts(doubts);
      console.log('✅ Doubts state updated');
    } catch (err) {
      console.error('❌ Error fetching my doubts:', err);
      setError(err.message || 'Failed to load your doubts.');
    }
  };

  const fetchAvailableDoubts = async () => {
    try {
      const data = await solverService.getAvailableDoubts();
      setAvailableDoubts(data || []);
    } catch (err) {
      console.error('Error fetching available doubts:', err);
      setError(err.message || 'Failed to load available doubts.');
    }
  };

  const fetchAssignedDoubts = async () => {
    try {
      const data = await solverService.getAssignedDoubts();
      setAssignedDoubts(data || []);
    } catch (err) {
      console.error('Error fetching assigned doubts:', err);
      setError(err.message || 'Failed to load assigned doubts.');
    }
  };

  const handleAcceptDoubt = async (doubtId) => {
    const result = await solverService.acceptDoubt(doubtId);
    fetchAvailableDoubts();
    fetchAssignedDoubts();
    return result;
  };

  const setDoubtsTab = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('tab', tab);
    router.replace(`/dashboard/doubts?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'solved') {
      router.replace('/dashboard/solved-doubts');
      return;
    }
    setActiveTab(parseDoubtsTab(tab));
  }, [searchParams, router]);

  const tabCounts = {
    'my-doubts': myDoubts.length,
    available: availableDoubts.length,
    assigned: assignedDoubts.length,
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!authService.isAuthenticated()) {
          router.push('/');
          return;
        }
        if (localStorage.getItem('cacheVerified') !== 'true') {
          router.push('/verify-cache');
          return;
        }
        await Promise.all([
          fetchMyDoubts(),
          fetchAvailableDoubts(),
          fetchAssignedDoubts(),
          solverService.getSolvedDoubts(1, 1).then((data) => {
            setSolvedCount(data?.pagination?.totalCount ?? 0);
          }).catch(() => setSolvedCount(0)),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const refreshAvailable = () => {
      void fetchAvailableDoubts();
    };
    const refreshAssigned = () => {
      void fetchAvailableDoubts();
      void fetchAssignedDoubts();
    };

    window.addEventListener('edu:doubt-available', refreshAvailable);
    window.addEventListener('edu:doubt-assigned', refreshAssigned);

    // Listen for doubt creation callback
    const handleDoubtCreated = () => {
      console.log('🎯 Callback: Doubt created, refreshing doubts list...');
      fetchMyDoubts();
    };

    // Listen for custom events
    const handleDoubtCreatedEvent = (event) => {
      console.log('🎯 Event: Doubt created event received:', event.detail);
      fetchMyDoubts();
    };

    // Listen for localStorage changes
    const handleStorageChange = (event) => {
      if (event.key === 'doubtCreated') {
        console.log('🎯 Storage: Doubt created flag detected, refreshing doubts list...');
        fetchMyDoubts();
      }
    };

    window.onDoubtCreated = handleDoubtCreated;
    window.addEventListener('doubtCreated', handleDoubtCreatedEvent);
    window.addEventListener('storage', handleStorageChange);

    // Periodic check for doubt creation flag (fallback)
    const checkInterval = setInterval(() => {
      const doubtCreatedFlag = localStorage.getItem('doubtCreated');
      if (doubtCreatedFlag) {
        console.log('🎯 Periodic: Doubt created flag found, refreshing...');
        fetchMyDoubts();
        localStorage.removeItem('doubtCreated');
      }
    }, 1000); // Check every 1 second (more aggressive)
    
    // Also check on page focus (when user comes back to this tab)
    const handlePageFocus = () => {
      console.log('🎯 Page focused, checking for new doubts...');
      fetchMyDoubts();
    };
    
    window.addEventListener('focus', handlePageFocus);

    // Cleanup
    return () => {
      window.onDoubtCreated = null;
      window.removeEventListener('doubtCreated', handleDoubtCreatedEvent);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handlePageFocus);
      clearInterval(checkInterval);
      window.removeEventListener('edu:doubt-available', refreshAvailable);
      window.removeEventListener('edu:doubt-assigned', refreshAssigned);
    };
  }, []);

  const renderDoubtsOverlays = ({ includeViewAnswer = false } = {}) => (
    <>
      {includeViewAnswer && viewAnswerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl transition-colors duration-300 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 transition-colors duration-300 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    New Answer
                  </span>
                  {viewAnswerModal.timeLabel ? (
                    <span className="text-xs text-gray-500">{viewAnswerModal.timeLabel}</span>
                  ) : null}
                </div>
                <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {viewAnswerModal.solverName} answered your question
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setViewAnswerModal(null)}
                aria-label="Close answer modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Question</div>
              <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100">
                {viewAnswerModal.questionText}
              </div>
              <div className="mb-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Answer</div>
              <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
                &quot;{viewAnswerModal.answerText}&quot;
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  const doubtsTopBar =
    activeTab === 'available' ? (
      <AvailableDoubtsPageHeader solvedCount={solvedCount} />
    ) : activeTab === 'my-doubts' ? (
      <MyDoubtsPageHeader availableCount={availableDoubts.length} solvedCount={solvedCount} />
    ) : null;

  const renderDoubtsMainContent = () => {
    if (isLoading) {
      return <DashboardContentLoading message="Loading doubts…" />;
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-[var(--dash-forest)] underline"
          >
            Try again
          </button>
        </div>
      );
    }

    if (activeTab === 'available') {
      return (
        <>
          {renderDoubtsOverlays()}
          <AvailableDoubtsSection availableDoubts={availableDoubts} onAcceptDoubt={handleAcceptDoubt} />
        </>
      );
    }

    if (activeTab === 'my-doubts') {
      return (
        <>
          {renderDoubtsOverlays({ includeViewAnswer: true })}
          <MyDoubtsSection
            myDoubts={myDoubts}
            onViewAnswer={(payload) => setViewAnswerModal(payload)}
          />
        </>
      );
    }

    return null;
  };

  if (activeTab === 'available' || activeTab === 'my-doubts') {
    return (
      <DashboardPageLayout
        loadingMessage="Loading doubts…"
        contentVariant="card"
        topBar={doubtsTopBar}
      >
        {renderDoubtsMainContent()}
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout loadingMessage="Loading doubts…" contentVariant="plain">
      {isLoading ? (
        <DashboardContentLoading message="Loading doubts…" />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-[var(--dash-forest)] underline"
          >
            Try again
          </button>
        </div>
      ) : (
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-200 bg-white p-4 transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Doubts</span>
              </button>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <div
                className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
                role="tablist"
                aria-label="Doubts sections"
              >
                {DOUBT_TABS.map((tab) => {
                  const count = tabCounts[tab.id];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setDoubtsTab(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                        isActive
                          ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                      }`}
                    >
                      {tab.label}
                      {count != null ? ` (${count})` : ''}
                    </button>
                  );
                })}
              </div>
              <DarkModeToggle />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {renderDoubtsOverlays({ includeViewAnswer: true })}
          {/* Lists */}
          <div className="mt-4">
        {activeTab === 'assigned' && (
          <div>
            <AssignedDoubtsSection
              assignedDoubts={assignedDoubts}
              onJoinSession={(id) => router.push(`/dashboard/session/${id}`)}
            />
          </div>
        )}

          </div>
        </div>
      </div>
      )}
    </DashboardPageLayout>
  );
};

export default DoubtManagement;
