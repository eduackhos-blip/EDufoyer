"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export type SolverLeftRatingModalProps = {
  open: boolean;
  doubtId: string;
  message?: string;
  systemRating?: number | null;
  attendancePercent?: number | null;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string) => void;
};

export function SolverLeftRatingModal({
  open,
  doubtId,
  message,
  systemRating = null,
  attendancePercent = null,
  submitting = false,
  onSubmit,
}: SolverLeftRatingModalProps) {
  const [comment, setComment] = useState("");
  const isSystemRated = systemRating != null && systemRating >= 1;

  useEffect(() => {
    if (!open) setComment("");
  }, [open, doubtId]);

  if (!open) return null;

  const displayRating = isSystemRated ? systemRating : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solver-left-rating-title"
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/40">
        <h3 id="solver-left-rating-title" className="text-lg font-semibold text-slate-100">
          Session ended
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          {message ??
            "Your solver has left the session. We rated them automatically from session attendance."}
        </p>

        {isSystemRated ? (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Solver rating (automatic)
            </p>
            <div className="mt-2 flex gap-1" aria-label={`${displayRating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 ${
                    star <= displayRating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            {attendancePercent != null ? (
              <p className="mt-2 text-sm text-slate-400">
                Based on {attendancePercent}% of the scheduled session time.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          <label
            htmlFor="solver-rating-comment"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Comments (optional)
          </label>
          <textarea
            id="solver-rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Anything else you want us to know?"
            className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => onSubmit(displayRating || 1, comment.trim())}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Continue to dashboard"}
        </button>
      </div>
    </div>
  );
}
