'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const SOLVER_PERFORMANCE_DATA = [
  { name: 'Mon', value: 2.8 },
  { name: 'Tue', value: 2.2 },
  { name: 'Wed', value: 2.0 },
  { name: 'Thu', value: 2.1 },
  { name: 'Fri', value: 3.8 },
  { name: 'Sat', value: 2.0 },
];

const MINI_STAT_CARD_SHELL =
  'dash-stat-card-shadow relative flex h-[8.25rem] w-full min-h-0 flex-col gap-2.5 rounded-[20px] p-4';

const MINI_STAT_PILL_CLASS =
  'self-start rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold leading-snug text-[var(--dash-forest)] shadow-[0_2px_6px_rgba(7,63,54,0.1)]';

const MINI_STAT_ARROW_SRC = '/Arrow%20up-left.png';

function CardArrow({ tone }: { tone: 'white' | 'forest-dark' }) {
  const color = tone === 'white' ? '#ffffff' : '#073E36';

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-4 top-4 block h-6 w-6 shrink-0"
      style={{
        backgroundColor: color,
        maskImage: `url("${MINI_STAT_ARROW_SRC}")`,
        WebkitMaskImage: `url("${MINI_STAT_ARROW_SRC}")`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

type MiniStatCardProps = {
  variant: 'forest' | 'mint' | 'canvas-adaptive';
  title: string;
  value: string;
  trend: string;
  suffix?: string;
};

function MiniStatCard({ variant, title, value, trend, suffix }: MiniStatCardProps) {
  const isForest = variant === 'forest';
  const isCanvasAdaptive = variant === 'canvas-adaptive';
  const backgroundColor = isForest
    ? 'var(--dash-forest)'
    : isCanvasAdaptive
      ? undefined
      : 'var(--dash-card-mint)';

  return (
    <article
      className={`${MINI_STAT_CARD_SHELL} ${isCanvasAdaptive ? 'daily-streak-card' : ''} ${
        isForest ? 'text-white' : 'text-[var(--dash-forest)]'
      }`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <CardArrow tone={isForest ? 'white' : 'forest-dark'} />
      <div>
        <h2 className="text-[11px] font-bold leading-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
          <span className="text-[1.25rem] font-extrabold leading-none text-[var(--dash-forest)]">{value}</span>
        </div>
        {suffix ? (
          <span className="text-[1.125rem] font-extrabold leading-none text-[var(--dash-forest)]">{suffix}</span>
        ) : null}
      </div>
      <div className={MINI_STAT_PILL_CLASS}>{trend}</div>
    </article>
  );
}

export function SolverRatingCard() {
  return (
    <MiniStatCard variant="forest" title="Solver rating" value="4.4" trend="+ 0.2 vs last week" />
  );
}

export function DailyStreakCard() {
  return (
    <MiniStatCard
      variant="canvas-adaptive"
      title="Daily streak"
      value="5"
      suffix="Days"
      trend="+ 0.2 vs last week"
    />
  );
}

export function PerformanceCard() {
  const [activeTab, setActiveTab] = useState<'Overall' | 'Completed'>('Overall');
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <article
      className="dash-stat-card-shadow flex flex-col rounded-[22px] border-[5px] bg-white p-5"
      style={{ borderColor: 'var(--dash-forest)' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--dash-forest)]">Performance</h2>
        <div className="flex items-center gap-3 text-[12px] font-semibold text-[var(--dash-forest)]">
          {(['Overall', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'underline underline-offset-4' : 'opacity-60'}
            >
              {tab}
            </button>
          ))}
          <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div className="h-64 w-full min-h-[19.5rem] min-w-0">
        {chartReady ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={256}>
            <LineChart data={SOLVER_PERFORMANCE_DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ece9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--dash-text-muted)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--dash-text-muted)', fontSize: 11 }}
                domain={[1, 4]}
                ticks={[1, 1.75, 2.5, 3.25, 4]}
                allowDecimals
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--dash-forest)"
                strokeWidth={2.5}
                dot={{
                  fill: 'var(--dash-card-mint)',
                  stroke: 'var(--dash-forest)',
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-[var(--dash-card-mint)]/40" aria-hidden />
        )}
      </div>
    </article>
  );
}

export default function DashboardStatCards() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <SolverRatingCard />
        <DailyStreakCard />
      </div>
      <PerformanceCard />
    </div>
  );
}
