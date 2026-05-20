'use client';

import Link from 'next/link';
import DoubtsPageHeaderShell from './DoubtsPageHeaderShell';

type AvailableDoubtsPageHeaderProps = {
  solvedCount?: number;
};

export default function AvailableDoubtsPageHeader({ solvedCount = 0 }: AvailableDoubtsPageHeaderProps) {
  return (
    <DoubtsPageHeaderShell
      title="Available doubts"
      actions={
        <Link
          href="/dashboard/solved-doubts"
          className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]"
        >
          Solved doubts ({solvedCount})
        </Link>
      }
    />
  );
}
