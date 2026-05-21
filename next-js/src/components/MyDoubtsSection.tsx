'use client';

import React, { useMemo, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import MyDoubtCard from './doubts/MyDoubtCard';

const MyDoubtsSection = ({ myDoubts, onViewAnswer }) => {
  const [query, setQuery] = useState('');

  const filteredDoubts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return myDoubts;
    return myDoubts.filter((doubt) => {
      const subject = String(doubt.subject || '').toLowerCase();
      const description = String(doubt.description || '').toLowerCase();
      const solver = String(doubt.solver?.name || '').toLowerCase();
      return subject.includes(q) || description.includes(q) || solver.includes(q);
    });
  }, [myDoubts, query]);

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--dash-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full rounded-full border border-[var(--dash-panel-border)] bg-white py-3 pl-12 pr-4 text-sm text-[var(--dash-text-body)] shadow-[var(--dash-inner-shadow)] outline-none transition-colors placeholder:text-[var(--dash-text-muted)] focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/15"
          aria-label="Search my doubts"
        />
      </div>

      {filteredDoubts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-white/60 px-6 py-14 text-center">
          <MessageCircle className="mb-4 h-12 w-12 text-[var(--dash-text-muted)]" aria-hidden />
          <p className="text-sm font-medium text-[var(--dash-text-body)]">
            {query.trim()
              ? 'No doubts match your search.'
              : "You haven't asked any doubts yet."}
          </p>
        </div>
      ) : (
        <div className="doubts-list-grid">
          {filteredDoubts.map((doubt) => (
            <MyDoubtCard
              key={doubt._id}
              doubt={doubt}
              onViewAnswer={onViewAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDoubtsSection;
