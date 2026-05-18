'use client';

import React, { useState } from 'react';
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

const ASKER_QUESTIONS_DATA = [
  { name: 'Mon', value: 2 },
  { name: 'Tue', value: 1 },
  { name: 'Wed', value: 3 },
  { name: 'Thu', value: 1 },
  { name: 'Fri', value: 4 },
  { name: 'Sat', value: 2 },
];

const MINI_STAT_CARD_SHELL =
  'relative flex h-[7rem] w-full min-h-0 flex-col rounded-[20px] p-3.5 shadow-[var(--dash-card-shadow)]';

const MINI_STAT_PILL_CLASS =
  'mt-auto self-start rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold leading-snug text-[var(--dash-forest)] shadow-[0_2px_6px_rgba(7,63,54,0.1)]';

function CardArrow({ className = '' }: { className?: string }) {
  return (
    <img
      src="/aboutus&contactusarrow.png"
      alt=""
      aria-hidden
      className={`h-3 w-auto object-contain opacity-90 ${className}`.trim()}
      decoding="async"
    />
  );
}

type MiniStatCardProps = {
  variant: 'forest' | 'mint';
  title: string;
  value: string;
  trend: string;
  suffix?: string;
};

function MiniStatCard({ variant, title, value, trend, suffix }: MiniStatCardProps) {
  const isForest = variant === 'forest';

  return (
    <article
      className={`${MINI_STAT_CARD_SHELL} ${isForest ? 'text-white' : 'text-[var(--dash-forest)]'}`}
      style={{ backgroundColor: isForest ? 'var(--dash-forest)' : 'var(--dash-card-mint)' }}
    >
      <div className="mb-2 flex items-start justify-between gap-1.5">
        <h2 className="text-[11px] font-bold leading-tight">{title}</h2>
        <CardArrow className={`shrink-0 ${isForest ? 'brightness-0 invert' : ''}`} />
      </div>
      <div className="flex items-center gap-2">
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

export function QuestionsAskedCard() {
  return (
    <MiniStatCard variant="forest" title="Questions asked" value="12" trend="+ 3 vs last week" />
  );
}

export function DailyStreakCard() {
  return (
    <MiniStatCard
      variant="mint"
      title="Daily streak"
      value="5"
      suffix="Days"
      trend="+ 0.2 vs last week"
    />
  );
}

type PerformanceCardProps = {
  isSolver: boolean;
};

export function PerformanceCard({ isSolver }: PerformanceCardProps) {
  const [activeTab, setActiveTab] = useState<'Overall' | 'Completed'>('Overall');
  const chartData = isSolver ? SOLVER_PERFORMANCE_DATA : ASKER_QUESTIONS_DATA;
  const title = isSolver ? 'Performance' : 'Questions asked';
  const yDomain: [number, number] = isSolver ? [1, 4] : [0, 5];
  const yTicks = isSolver ? [1, 1.75, 2.5, 3.25, 4] : [0, 1, 2, 3, 4, 5];

  return (
    <article
      className="flex flex-col rounded-[22px] border-[3px] bg-white p-5 shadow-[var(--dash-card-shadow)]"
      style={{ borderColor: 'var(--dash-forest)' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--dash-forest)]">{title}</h2>
        {isSolver ? (
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
        ) : (
          <span className="text-[12px] font-semibold text-[var(--dash-text-muted)]">This week</span>
        )}
      </div>
      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
              domain={yDomain}
              ticks={yTicks}
              allowDecimals={!isSolver}
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
      </div>
    </article>
  );
}

type DashboardStatCardsProps = {
  isSolver: boolean;
};

export default function DashboardStatCards({ isSolver }: DashboardStatCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {isSolver ? <SolverRatingCard /> : <QuestionsAskedCard />}
        <DailyStreakCard />
      </div>
      <PerformanceCard isSolver={isSolver} />
    </div>
  );
}
