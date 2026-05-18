import { Clock } from "lucide-react";

export type MeetingTimerBadgeProps = {
  timerLabel: string;
  categoryLabel?: string | null;
  isRunning?: boolean;
  compact?: boolean;
};

export function MeetingTimerBadge({
  timerLabel,
  categoryLabel,
  isRunning = false,
  compact = false,
}: MeetingTimerBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-indigo-500/35 bg-indigo-500/10 text-center ${
        compact ? "px-2.5 py-1" : "px-4 py-1.5"
      }`}
      title={
        isRunning
          ? "Time remaining in this session"
          : "Planned session length — timer starts when both participants join"
      }
    >
      <div className="flex items-center gap-1.5">
        <Clock className={`text-indigo-300 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} aria-hidden />
        <span
          className={`font-mono font-semibold tabular-nums text-indigo-50 ${
            compact ? "text-sm" : "text-base lg:text-lg"
          }`}
        >
          {timerLabel}
        </span>
      </div>
      {categoryLabel ? (
        <span className={`text-indigo-300/90 ${compact ? "text-[10px]" : "text-xs"}`}>{categoryLabel}</span>
      ) : null}
      {!isRunning ? (
        <span className={`text-indigo-400/70 ${compact ? "text-[9px]" : "text-[10px]"}`}>starts when both join</span>
      ) : null}
    </div>
  );
}
