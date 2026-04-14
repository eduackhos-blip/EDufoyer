import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, Search, Menu, TrendingUp } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import authService from '../services/authService';
import doubtService from '../services/doubtService';
import { useNavigate, useLocation } from 'react-router-dom';
import SharedSidebar from './SharedSidebar';
import { buildDashboardSidebarItems } from './dashboardSidebarUtils';
import { DashboardSidebarSuggested, DashboardSidebarUserFooter } from './DashboardSidebarExtras';
import WalletDisplay from './WalletDisplay';
import DarkModeToggle from './DarkModeToggle';
import ProfileAskDoubtCard from './ProfileAskDoubtCard';

const DEFAULT_PROFILE_COVER_URL = '/cover-photo-profile-page.jpg';

/** Deterministic “weekly” series from user id + activity so the chart shape is stable per user */
function buildPerformanceSeries(userId, solvedCount, mode) {
  const seed = String(userId || 'guest')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activityBoost = Math.min(1.4, 0.35 + (Number(solvedCount) || 0) * 0.06);
  return days.map((name, i) => {
    const t = (seed % 97) / 97 + i * 0.17;
    const wave = Math.sin(t * 2.8) * 0.65 + Math.cos(t * 1.3) * 0.35;
    let v = 2.4 + wave * activityBoost;
    if (mode === 'Pending') v *= 0.82;
    v = Math.min(4, Math.max(1, v));
    return { name, value: Number(v.toFixed(2)) };
  });
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [extProfile, setExtProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [askedCount, setAskedCount] = useState(0);
  const [solvedThisMonth, setSolvedThisMonth] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [perfTab, setPerfTab] = useState('Overall');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/');
        return;
      }
      const cacheOk = localStorage.getItem('cacheVerified') === 'true';
      if (!cacheOk) {
        navigate('/verify-cache');
        return;
      }
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const [userData, doubtsRes, metricsRes, profRes] = await Promise.all([
          authService.getProfile(),
          doubtService.getMyDoubts(1, 200).catch(() => ({ doubts: [], pagination: { totalDoubts: 0 } })),
          fetch('/api/solver/metrics', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .catch(() => ({ success: false })),
          fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .catch(() => ({ success: false })),
        ]);

        setUser(userData);

        const doubts = doubtsRes.doubts || doubtsRes?.data?.doubts || [];
        const totalAsked =
          doubtsRes.pagination?.totalDoubts ?? doubtsRes?.data?.pagination?.totalDoubts ?? doubts.length;
        setAskedCount(Number(totalAsked) || 0);

        if (metricsRes?.success) {
          setSolvedThisMonth(metricsRes.data?.solvedCount ?? 0);
          setAvgRating(
            metricsRes.data?.avgRating != null ? Number(metricsRes.data.avgRating) : null
          );
        }

        if (profRes?.success && profRes.data && !profRes.data.error) {
          setExtProfile(profRes.data);
        }
      } catch (e) {
        console.error(e);
        authService.logout();
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const userId = user?.id || user?._id || '';

  const handleFromEmail = useMemo(() => {
    if (user?.username) return `@${user.username}`;
    const em = user?.email || '';
    const local = em.split('@')[0] || 'user';
    return `@${local.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20) || 'user'}`;
  }, [user?.email, user?.username]);

  const subtitleLine = useMemo(() => {
    if (user?.bio && String(user.bio).trim()) {
      return String(user.bio).trim();
    }
    if (extProfile?.strongSubject) {
      return `${extProfile.strongSubject} • ${user?.isSolver ? 'Solver' : 'Student'}`;
    }
    if (user?.isSolver) return 'Peer solver on EduFoyer';
    return 'Student • KIIT';
  }, [extProfile, user]);

  const chartData = useMemo(
    () => buildPerformanceSeries(userId, solvedThisMonth, perfTab === 'Pending' ? 'Pending' : 'Overall'),
    [userId, solvedThisMonth, perfTab]
  );

  const perfDelta = useMemo(() => {
    if (chartData.length < 2) return 0;
    const a = chartData[chartData.length - 1].value;
    const b = chartData[chartData.length - 2].value;
    return Number((a - b).toFixed(2));
  }, [chartData]);

  const getAvatarUrl = (name) => {
    const safe = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=e0e7ff&color=3730a3&size=256&bold=true`;
  };

  const displayAvatarSrc = (u) => {
    const raw = u?.avatarUrl ?? u?.avatar;
    if (raw && String(raw).trim()) return String(raw).trim();
    return getAvatarUrl(u?.name);
  };

  const coverBannerStyle = useMemo(() => {
    const raw = user?.coverImageUrl && String(user.coverImageUrl).trim();
    const imageUrl = raw || DEFAULT_PROFILE_COVER_URL;
    return {
      backgroundImage: `url(${JSON.stringify(imageUrl)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }, [user?.coverImageUrl, user?.updatedAt]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const handleHelpSupport = () => navigate('/contact');

  const sidebarItems = buildDashboardSidebarItems({
    user,
    pathname: location.pathname,
    search: location.search,
    onLogout: handleLogout,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
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

      <main className="flex-1 flex flex-col min-w-0 min-h-0 lg:ml-0">
        <header className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsSidebarOpen((o) => !o)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                {user?.name || 'Profile'}
              </span>
            </div>
            <div className="flex-1 w-full sm:min-w-0 relative max-w-xl sm:mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQ.trim()) {
                    navigate(`/dashboard/doubts?tab=available`);
                  }
                }}
                placeholder="Search Doubt"
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end sm:justify-start shrink-0">
              <DarkModeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden font-sans">
            <div className="mt-0 overflow-hidden">
              <div
                key={`cover-${user?.updatedAt}-${(user?.coverImageUrl || '').length}`}
                className="h-44 md:h-52 w-full bg-cover bg-center"
                style={coverBannerStyle}
              />
            </div>

            <div className="px-4 sm:px-6 md:px-10 pt-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-8 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1 min-w-0">
                  <div className="-mt-14 md:-mt-16 shrink-0 mx-auto sm:mx-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
                      <img
                        key={`hero-${user?.updatedAt}-${(user?.avatarUrl || '').length}`}
                        src={displayAvatarSrc(user)}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="w-full text-center sm:text-left space-y-1.5 pt-2 sm:pt-4 min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words leading-tight">
                      {user?.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-base break-all sm:break-words">
                      {handleFromEmail}
                    </p>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-snug break-words max-w-2xl mx-auto sm:mx-0">
                      {subtitleLine}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>
                        <strong className="text-gray-900 dark:text-white">{solvedThisMonth}</strong>{' '}
                        <span className="text-gray-500 dark:text-gray-400">Solved</span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">(this month)</span>
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">{askedCount}</strong>{' '}
                        <span className="text-gray-500 dark:text-gray-400">Asked</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-center lg:text-right pt-2 lg:pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Average rating:{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {avgRating != null ? avgRating.toFixed(1) : '—'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 pb-6 md:pb-8">
                <button
                  type="button"
                  id="account-section"
                  onClick={() => navigate('/dashboard/profile/edit')}
                  className="px-5 py-2.5 rounded-xl border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full sm:w-auto"
                >
                  Edit profile
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 border-t border-gray-100 dark:border-gray-700">
              <WalletDisplay />

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
                  <div className="flex rounded-full bg-gray-100 dark:bg-gray-700/80 p-1">
                    {['Overall', 'Pending'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPerfTab(tab)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                          perfTab === tab
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-4">
                  <TrendingUp className="w-4 h-4" />
                  Performance: {perfDelta >= 0 ? '+' : ''}
                  {perfDelta} last week
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profilePerfFillBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-600" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis
                        domain={[1, 4]}
                        ticks={[1, 1.75, 2.5, 3.25, 4]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                        }}
                        labelStyle={{ fontWeight: 600 }}
                        formatter={(v) => [`${v}`, perfTab === 'Pending' ? 'Pending load' : 'Score']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fill="url(#profilePerfFillBlue)"
                        dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="md:col-span-2 xl:col-span-1">
                <ProfileAskDoubtCard />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
