import Link from "next/link";
import { useCurrentSessionUser } from "@/src/hooks/useCurrentSessionUser";
import { MeetingTimerBadge } from "./MeetingTimerBadge";

export type RoomPreJoinLobbyHeaderProps = {
  roomId: string | undefined;
  meetingTimerLabel?: string | null;
  categorySessionLabel?: string | null;
  isTimerRunning?: boolean;
};

export function RoomPreJoinLobbyHeader({
  roomId,
  meetingTimerLabel,
  categorySessionLabel,
  isTimerRunning = false,
}: RoomPreJoinLobbyHeaderProps) {
  const user = useCurrentSessionUser();
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-0.5 max-lg:gap-2 lg:gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dash-forest)]">Join meeting</p>
        <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-[var(--dash-text-body)] lg:text-2xl">
          {roomId ? `Room: ${roomId}` : "Room"}
        </h1>
        {user?.username ? (
          <p className="mt-1 text-sm text-[var(--dash-text-muted)]">Signed in as {user.username}</p>
        ) : null}
      </div>
      {meetingTimerLabel ? (
        <MeetingTimerBadge
          timerLabel={meetingTimerLabel}
          categoryLabel={categorySessionLabel}
          isRunning={isTimerRunning}
        />
      ) : (
        <div />
      )}
      <Link
        href="/dashboard"
        className="justify-self-end rounded-md border border-[var(--dash-panel-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--dash-forest)] transition hover:bg-[var(--dash-card-mint)] max-lg:shrink-0 lg:rounded-lg lg:px-4 lg:py-2 lg:text-sm"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
