"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export type AskerLeaveRatingModalProps = {
  open: boolean;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string) => void;
  /** Leave without rating → solver grace period applies. */
  onSkip: () => void;
};

export function AskerLeaveRatingModal({
  open,
  submitting = false,
  onSubmit,
  onSkip,
}: AskerLeaveRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setRating(0);
      setHovered(0);
      setComment("");
    }
  }, [open]);

  if (!open) return null;

  const display = hovered || rating;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asker-leave-rating-title"
    >
      <button
        type="button"
        aria-label="Leave without rating"
        className="absolute inset-0 bg-black/70"
        onClick={onSkip}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/40">
        <h3 id="asker-leave-rating-title" className="text-lg font-semibold text-slate-100">
          Rate your solver before leaving?
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          If you submit a rating, the session ends immediately for both of you. If you leave without
          rating, your solver will wait up to 3 minutes in case you rejoin by mistake.
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your rating</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="rounded p-1 transition hover:scale-105"
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= display ? "fill-amber-400 text-amber-400" : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="asker-leave-comment"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Comments (optional)
          </label>
          <textarea
            id="asker-leave-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="How was the session?"
            className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={submitting || rating < 1}
            onClick={() => onSubmit(rating, comment.trim())}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Ending session…" : "Submit rating & leave"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSkip}
            className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
          >
            Leave without rating
          </button>
        </div>
      </div>
    </div>
  );
}
