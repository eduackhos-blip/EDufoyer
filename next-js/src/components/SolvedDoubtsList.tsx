'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import solverService from '../services/solverService';
import SolvedDoubtCard from './doubts/SolvedDoubtCard';

type SolvedDoubtsListProps = {
  searchQuery?: string;
  onTotalCountChange?: (count: number) => void;
};

const SolvedDoubtsList = ({ searchQuery = '', onTotalCountChange }: SolvedDoubtsListProps) => {
  const [solvedDoubts, setSolvedDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSolvedDoubts();
  }, [currentPage]);

  const fetchSolvedDoubts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await solverService.getSolvedDoubts(currentPage, 10);
      setSolvedDoubts(data.solvedDoubts || []);
      const total = data?.pagination?.totalCount ?? 0;
      setPagination(data.pagination);
      onTotalCountChange?.(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoubts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return solvedDoubts;
    return solvedDoubts.filter((solverDoubt) => {
      const doubt = solverDoubt.doubt_id;
      const subject = String(doubt?.subject || '').toLowerCase();
      const description = String(doubt?.description || '').toLowerCase();
      const student = String(doubt?.doubter_id?.name || '').toLowerCase();
      return subject.includes(q) || description.includes(q) || student.includes(q);
    });
  }, [solvedDoubts, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--dash-forest)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 px-6 py-8 text-center">
        <p className="text-sm text-red-600">Error: {error}</p>
        <button
          type="button"
          onClick={fetchSolvedDoubts}
          className="mt-3 rounded-full bg-[var(--dash-forest)] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (solvedDoubts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] bg-white/60 px-6 py-14 text-center">
        <CheckCircle className="mb-4 h-12 w-12 text-[var(--dash-text-muted)]" aria-hidden />
        <p className="text-sm font-medium text-[var(--dash-text-body)]">No solved doubts yet</p>
        <p className="mt-1 text-xs text-[var(--dash-text-muted)]">Start solving doubts to see them here.</p>
      </div>
    );
  }

  if (filteredDoubts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] bg-white/60 px-6 py-14 text-center">
        <p className="text-sm font-medium text-[var(--dash-text-body)]">No doubts match your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
        {filteredDoubts.map((solverDoubt) => {
          const doubt = solverDoubt.doubt_id;
          const doubter = doubt?.doubter_id;

          return (
            <SolvedDoubtCard
              key={solverDoubt._id}
              subject={doubt?.subject}
              description={doubt?.description}
              studentName={doubter?.name || 'Unknown Student'}
              resolvedAt={solverDoubt.resolved_at}
              rating={solverDoubt.feedback_rating || 0}
            />
          );
        })}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={!pagination.hasPrevPage}
            className="rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-[var(--dash-text-body)]">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default SolvedDoubtsList;
