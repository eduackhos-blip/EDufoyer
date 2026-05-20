import { User } from "lucide-react";

export type MeetWaitingForPeerProps = {
  /** Grace countdown e.g. "02:34" — shown when waiting for rejoin after accidental leave */
  countdownLabel?: string | null;
  participantName?: string;
};

export function MeetWaitingForPeer({
  countdownLabel,
  participantName,
}: MeetWaitingForPeerProps) {
  const statusLine = participantName
    ? `Waiting for ${participantName}`
    : "Waiting for other person";

  return (
    <div className="meet-waiting-panel" role="status" aria-live="polite">
      <div className="meet-waiting-panel__avatar" aria-hidden>
        <User className="h-[42%] w-[42%] text-white/90" strokeWidth={1.75} />
      </div>
      <p className="meet-waiting-panel__title">{statusLine}</p>
      <div className="meet-waiting-panel__dots" aria-hidden>
        <span className="meet-waiting-panel__dot" />
        <span className="meet-waiting-panel__dot" />
        <span className="meet-waiting-panel__dot" />
      </div>
      {countdownLabel ? (
        <div className="meet-waiting-panel__timer-card">
          <span className="meet-waiting-panel__timer-label">Waiting for</span>
          <span className="meet-waiting-panel__timer-value">{countdownLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
