"use client";

import { BookOpen, Calendar, CheckCircle, Clock, Video, X } from "lucide-react";
import type { IncomingDoubt } from "@/src/types/incomingDoubt";

export type SolverAvailableDoubtModalProps = {
  doubt: IncomingDoubt;
  isJoining: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

export default function SolverAvailableDoubtModal({
  doubt,
  isJoining,
  onAccept,
  onDismiss,
}: SolverAvailableDoubtModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div
          className="rounded-t-xl p-4 text-white"
          style={{ backgroundColor: "var(--dash-forest)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">New Doubt Available!</h3>
                <p className="text-xs text-white/80">A new doubt is waiting for you</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isJoining}
              className="text-white/80 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 text-center">
            <div
              className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--dash-card-mint)" }}
            >
              <BookOpen className="h-6 w-6 text-[var(--dash-forest)]" />
            </div>
            <h4 className="mb-1 text-lg font-semibold text-[var(--dash-text-body)]">
              New Doubt Available
            </h4>
            <p className="text-sm text-[var(--dash-text-muted)]">
              &quot;{doubt.subject}&quot; needs your expertise
            </p>
          </div>
          <div
            className="mb-4 rounded-lg p-3"
            style={{ backgroundColor: "var(--dash-card-mint)" }}
          >
            <div className="mb-2 flex items-center gap-2 text-[var(--dash-forest)]">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Doubt Details</span>
            </div>
            <div className="space-y-1 text-sm text-[var(--dash-text-muted)]">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Subject: {doubt.subject}</span>
              </div>
              {doubt.is_scheduled && doubt.scheduled_date ? (
                <div className="mt-1.5 rounded border border-[var(--dash-forest)]/20 bg-white/60 p-1.5 text-xs font-semibold text-[var(--dash-forest)]">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Scheduled:{" "}
                  {new Date(doubt.scheduled_date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {doubt.scheduled_time ? ` at ${doubt.scheduled_time}` : null}
                </div>
              ) : null}
              {doubt.description ? (
                <p className="line-clamp-2 text-xs">{doubt.description}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={onAccept}
              disabled={isJoining}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "var(--dash-forest)" }}
            >
              {isJoining ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{doubt.is_scheduled ? "Accepting…" : "Joining Session…"}</span>
                </>
              ) : doubt.is_scheduled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Accept</span>
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  <span>Accept & Join</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isJoining}
              className="w-full rounded-lg border border-[var(--dash-forest)]/25 py-2 text-sm font-medium text-[var(--dash-forest)] hover:bg-[var(--dash-card-mint)]/50 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
