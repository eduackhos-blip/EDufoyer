import { Clock } from "lucide-react";

export type MeetingTimerBadgeProps = {
  timerLabel: string;
  categoryLabel?: string | null;
  isRunning?: boolean;
  compact?: boolean;
  /** dashboard = mint pre-join theme; dark = in-call header */
  variant?: "dashboard" | "dark";
};

export function MeetingTimerBadge({
  timerLabel,
  categoryLabel,
  isRunning = false,
  compact = false,
  variant = "dashboard",
}: MeetingTimerBadgeProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-2.5 py-1" : "px-4 py-1.5"
      } ${
        isDark
          ? "rounded-lg border border-indigo-500/35 bg-indigo-500/10"
          : "rounded-2xl border border-[var(--dash-panel-border)] bg-[var(--dash-card-mint)] shadow-[var(--dash-inner-shadow)]"
      }`}
      title={
        isRunning
          ? "Time remaining in this session"
          : "Planned session length — timer starts when both participants join"
      }
    >
      <div className="flex items-center gap-1.5">
        <Clock
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${
            isDark ? "text-indigo-300" : "text-[var(--dash-forest)]"
          }`}
          aria-hidden
        />
        <span
          className={`font-mono font-semibold tabular-nums ${
            compact ? "text-sm" : "text-base lg:text-lg"
          } ${isDark ? "text-indigo-50" : "text-[var(--dash-text-body)]"}`}
        >
          {timerLabel}
        </span>
      </div>
      {categoryLabel ? (
        <span
          className={`${compact ? "text-[10px]" : "text-xs"} ${
            isDark ? "text-indigo-300/90" : "text-[var(--dash-text-muted)]"
          }`}
        >
          {categoryLabel}
        </span>
      ) : null}
      {!isRunning ? (
        <span
          className={`${compact ? "text-[9px]" : "text-[10px]"} ${
            isDark ? "text-indigo-400/70" : "text-[var(--dash-text-muted)]"
          }`}
        >
          starts when both join
        </span>
      ) : null}
    </div>
  );
}
