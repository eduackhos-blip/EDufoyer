'use client';

import Link from 'next/link';
import DoubtsPageHeaderShell from './DoubtsPageHeaderShell';

type MyDoubtsPageHeaderProps = {
  availableCount?: number;
  solvedCount?: number;
};

export default function MyDoubtsPageHeader({
  availableCount = 0,
  solvedCount = 0,
}: MyDoubtsPageHeaderProps) {
  return (
    <DoubtsPageHeaderShell
      title="My doubts"
      actions={
        <>
          <Link
            href="/dashboard/doubts?tab=available"
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
          >
            Available doubts ({availableCount})
          </Link>
          <Link
            href="/dashboard/solved-doubts"
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
          >
            Solved doubts ({solvedCount})
          </Link>
        </>
      }
    />
  );
}
