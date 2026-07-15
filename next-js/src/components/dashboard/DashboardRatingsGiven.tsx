'use client';

import React from 'react';
import { Star } from 'lucide-react';

function CardArrow() {
  return (
    <img
      src="/aboutus&contactusarrow.png"
      alt=""
      aria-hidden
      className="h-3.5 w-auto object-contain"
      decoding="async"
    />
  );
}

/** Static 5-star ratings the student gave to solvers. */
const RATINGS_GIVEN = [
  {
    solver: 'Rahul Sharma',
    topic: 'Java',
    date: 'May 10, 2026',
  },
  {
    solver: 'Ananya Patel',
    topic: 'Organic Chemistry',
    date: 'May 8, 2026',
  },
  {
    solver: 'Vikram Kumar',
    topic: 'Linear Algebra',
    date: 'May 3, 2026',
  },
];

export default function DashboardRatingsGiven() {
  return (
    <article className="rounded-[22px] bg-white p-5 shadow-[var(--dash-card-shadow)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[var(--dash-forest)]">Your 5-star ratings</h2>
        <CardArrow />
      </div>

      <ol className="space-y-3">
        {RATINGS_GIVEN.map((item) => (
          <li
            key={`${item.solver}-${item.topic}`}
            className="rounded-[16px] border border-[var(--dash-forest)]/12 px-4 py-3"
            style={{ backgroundColor: 'var(--dash-card-mint)' }}
          >
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
              <p className="text-[13px] font-bold text-[var(--dash-forest)]">{item.solver}</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--dash-forest)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                <Star className="h-3 w-3 fill-white" strokeWidth={0} aria-hidden />
                5
              </span>
            </div>
            <p className="text-[12px] font-semibold text-[var(--dash-forest)]">Topic: {item.topic}</p>
            <p className="mt-1 text-[11px] text-[var(--dash-text-muted)]">{item.date}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
