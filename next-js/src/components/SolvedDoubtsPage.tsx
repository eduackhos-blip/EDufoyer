'use client';

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import SolvedDoubtsList from './SolvedDoubtsList';
import SolvedDoubtsPageHeader from './doubts/SolvedDoubtsPageHeader';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import solverService from '../services/solverService';

const SolvedDoubtsPage = () => {
  const [availableCount, setAvailableCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    solverService
      .getAvailableDoubts()
      .then((list) => setAvailableCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setAvailableCount(0));
  }, []);

  return (
    <DashboardPageLayout
      loadingMessage="Loading solved doubts…"
      contentVariant="card"
      topBar={<SolvedDoubtsPageHeader solvedCount={solvedCount} availableCount={availableCount} />}
    >
      <div className="relative mb-5">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--dash-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full rounded-full border border-[var(--dash-panel-border)] bg-white py-3 pl-12 pr-4 text-sm text-[var(--dash-text-body)] shadow-[var(--dash-inner-shadow)] outline-none placeholder:text-[var(--dash-text-muted)] focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/15"
          aria-label="Search solved doubts"
        />
      </div>

      <SolvedDoubtsList searchQuery={searchQuery} onTotalCountChange={setSolvedCount} />
    </DashboardPageLayout>
  );
};

export default SolvedDoubtsPage;
