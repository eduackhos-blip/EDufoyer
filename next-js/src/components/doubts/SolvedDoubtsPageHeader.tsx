'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import DoubtsPageHeaderShell from './DoubtsPageHeaderShell';

type SolvedDoubtsPageHeaderProps = {
  solvedCount?: number;
  availableCount?: number;
};

export default function SolvedDoubtsPageHeader({
  solvedCount = 0,
  availableCount = 0,
}: SolvedDoubtsPageHeaderProps) {
  return (
    <DoubtsPageHeaderShell
      title="Solved doubts"
      className="dash-page-header--solved"
      actions={
        <>
          <Link
            href="/dashboard/doubts?tab=available"
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
          >
            Available doubts ({availableCount})
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#073E36] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)]">
            <CheckCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            {solvedCount} doubts solved
          </span>
        </>
      }
    />
  );
}
