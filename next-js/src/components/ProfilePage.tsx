import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, TrendingUp } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import WalletDisplay from './WalletDisplay';
import DarkModeToggle from './DarkModeToggle';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import DashboardSplashTitle from './dashboard/DashboardSplashTitle';
import ProfileAskDoubtCard from './ProfileAskDoubtCard';

const DEFAULT_PROFILE_COVER_URL = '/cover-photo-profile-page.jpg';

const FOREST = '#073E36';
const FOREST_SOFT = 'rgba(7, 62, 54, 0.12)';

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

const inputSearchClass =
  'w-full rounded-full border border-[var(--dash-panel-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--dash-text-body)] shadow-[var(--dash-inner-shadow)] outline-none placeholder:text-[var(--dash-text-muted)] focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/15';

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [extProfile, setExtProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [askedCount, setAskedCount] = useState(0);
  const [solvedThisMonth, setSolvedThisMonth] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [perfTab, setPerfTab] = useState('Overall');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!authService.isAuthenticated()) {
        router.push('/');
        return;
      }
      const cacheOk = localStorage.getItem('cacheVerified') === 'true';
      if (!cacheOk) {
        router.push('/verify-cache');
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
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=e3edd8&color=073E36&size=256&bold=true`;
  };

  const displayAvatarSrc = (u) => {
    const raw = u?.avatarUrl ?? u?.avatar;
    if (raw && String(raw).trim()) return String(raw).trim();
    return getAvatarUrl(u?.name);
  };

  const coverBannerStyle = useMemo(() => {
    const raw = user?.coverImageUrl && String(user.coverImageUrl).trim();
    const imageUrl = raw || DEFAULT_PROFILE_COVER_URL;
    const safe = String(imageUrl).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return {
      backgroundImage: `url('${safe}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }, [user?.coverImageUrl, user?.updatedAt]);

  if (isLoading) {
    return (
      <DashboardPageLayout loadingMessage="Loading profile…">
        <div className="flex min-h-[16rem] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--dash-forest)]" />
          <span className="ml-3 text-[var(--dash-text-body)]">Loading profile…</span>
        </div>
      </DashboardPageLayout>
    );
  }

  const profileHeader = (
    <header className="dash-page-header mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5">
      <DashboardSplashTitle variant="page">Profile</DashboardSplashTitle>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative min-w-[10rem] max-w-xs flex-1 sm:min-w-[14rem] sm:flex-initial">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQ.trim()) {
                router.push(`/dashboard/doubts?tab=available`);
              }
            }}
            placeholder="Search doubt"
            className={inputSearchClass}
            aria-label="Search doubt"
          />
        </div>
        <DarkModeToggle />
        <button
          type="button"
          onClick={() => router.push('/dashboard/profile/edit')}
          className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
        >
          Edit profile
        </button>
      </div>
    </header>
  );

  return (
    <DashboardPageLayout loadingMessage="Loading profile…" contentVariant="card" topBar={profileHeader}>
      <div className="dash-panel-card overflow-hidden font-sans">
        <div
          key={`cover-${user?.updatedAt}-${(user?.coverImageUrl || '').length}`}
          className="h-44 w-full bg-cover bg-center md:h-52"
          style={coverBannerStyle}
        />

        <div className="border-b border-[var(--dash-panel-border)] px-4 pb-6 pt-0 sm:px-6 md:px-10">
          <div className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
              <div className="-mt-14 shrink-0 self-center sm:mx-0 sm:self-start md:-mt-16">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-[var(--dash-panel-shadow)] ring-1 ring-[var(--dash-panel-border)] md:h-32 md:w-32">
                  <img
                    key={`hero-${user?.updatedAt}-${(user?.avatarUrl || '').length}`}
                    src={displayAvatarSrc(user)}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 pt-2 text-center sm:pt-4 sm:text-left">
                <h2 className="break-words text-2xl font-bold leading-tight text-[var(--dash-forest)] md:text-3xl">
                  {user?.name}
                </h2>
                <p className="break-all text-base font-medium text-[var(--dash-text-muted)] sm:break-words">
                  {handleFromEmail}
                </p>
                <p className="mx-auto max-w-2xl break-words text-sm leading-snug text-[var(--dash-text-body)] sm:mx-0 md:text-base">
                  {subtitleLine}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-[var(--dash-text-body)] sm:justify-start">
                  <span>
                    <strong className="text-[var(--dash-forest)]">{solvedThisMonth}</strong>{' '}
                    <span className="text-[var(--dash-text-muted)]">Solved</span>
                    <span className="ml-1 text-xs text-[var(--dash-text-muted)]">(this month)</span>
                  </span>
                  <span>
                    <strong className="text-[var(--dash-forest)]">{askedCount}</strong>{' '}
                    <span className="text-[var(--dash-text-muted)]">Asked</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 pt-2 text-center lg:pt-4 lg:text-right">
              <p className="text-sm text-[var(--dash-text-body)]">
                Average rating:{' '}
                <span className="font-bold text-[var(--dash-forest)]">
                  {avgRating != null ? avgRating.toFixed(1) : '—'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-[var(--dash-panel-border)] bg-[var(--dash-card-mint)]/25 p-4 md:grid-cols-2 md:p-6 xl:grid-cols-3">
          <WalletDisplay />

          <article className="dash-panel-card p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--dash-forest)]">Performance</h3>
              <div className="flex rounded-full border border-[var(--dash-panel-border)] bg-[var(--dash-card-mint)]/40 p-1">
                {['Overall', 'Pending'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPerfTab(tab)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      perfTab === tab
                        ? 'bg-[var(--dash-forest)] text-white shadow-sm'
                        : 'text-[var(--dash-text-body)] hover:bg-white/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--dash-forest)]">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Performance: {perfDelta >= 0 ? '+' : ''}
              {perfDelta} last week
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profilePerfFillForest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={FOREST} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={FOREST} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={FOREST_SOFT} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7a76', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[1, 4]}
                    ticks={[1, 1.75, 2.5, 3.25, 4]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7a76', fontSize: 11 }}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--dash-panel-border)',
                      boxShadow: 'var(--dash-inner-shadow)',
                    }}
                    labelStyle={{ fontWeight: 600, color: FOREST }}
                    formatter={(v) => [`${v}`, perfTab === 'Pending' ? 'Pending load' : 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={FOREST}
                    strokeWidth={2.5}
                    fill="url(#profilePerfFillForest)"
                    dot={{ r: 4, fill: FOREST, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="md:col-span-2 xl:col-span-1">
            <ProfileAskDoubtCard />
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default ProfilePage;
