import { Clock, Video } from "lucide-react";
import type { ReactNode } from "react";

export type MeetingSessionHeaderProps = {
  meetingTitle: string;
  meetingDescription: string;
  meetingTimerLabel?: string | null;
  onExitClick?: () => void;
  trailing?: ReactNode;
};

export function MeetingSessionHeader({
  meetingTitle,
  meetingDescription,
  meetingTimerLabel,
  onExitClick,
  trailing,
}: MeetingSessionHeaderProps) {
  return (
    <header className="meet-header">
      <div className="meet-header__inner">
        <div className="meet-header__title-row">
          <div className="meet-header__icon-wrap" aria-hidden>
            <Video className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
              {meetingTitle}
            </h1>
            <p className="mt-0.5 truncate text-sm font-normal text-white/85 sm:text-base">
              {meetingDescription}
            </p>
          </div>
        </div>
        {trailing ?? (
          <div className="meet-header__actions">
            {meetingTimerLabel ? (
              <div className="meet-header__timer-pill">
                <Clock className="h-4 w-4 shrink-0 text-[var(--meet-forest)]" aria-hidden />
                <span className="font-mono text-sm font-semibold tabular-nums text-[var(--meet-forest)]">
                  {meetingTimerLabel}
                </span>
              </div>
            ) : null}
            {onExitClick ? (
              <button type="button" className="meet-header__exit-btn" onClick={onExitClick}>
                <img
                  src="/Arrow up-left.png"
                  alt=""
                  aria-hidden
                  className="meet-header__exit-icon"
                  decoding="async"
                />
                <span>Exit</span>
              </button>
            ) : (
              <div className="meet-header__stars" aria-hidden>
                <img src="/fillStarBottom.png" alt="" className="meet-header__star meet-header__star--lg" decoding="async" />
                <img src="/fillStarBottom.png" alt="" className="meet-header__star meet-header__star--md" decoding="async" />
                <img src="/fillStarBottom.png" alt="" className="meet-header__star meet-header__star--sm" decoding="async" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
