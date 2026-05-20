import { ArrowUpRight, Clock, MoreHorizontal } from "lucide-react";
import { useCurrentSessionUser } from "@/src/hooks/useCurrentSessionUser";
import { getFirstNameInitial } from "@/src/lib/userInitial";
import { CameraIcon, MicIcon } from "./CallControlIcons";
import { RoomPreJoinLobbyHeader } from "./RoomPreJoinLobbyHeader";

export type RoomPreJoinLobbyProps = {
  meetingTitle: string;
  meetingDescription: string;
  meetingTimerLabel?: string | null;
  isTimerRunning?: boolean;
  peersCount?: number;
  waitingPeerInitial?: string;
  myStream: MediaStream | null;
  mediaError: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  handleMicToggle: () => void;
  handleCameraToggle: () => void;
  onReadyToJoin: () => void;
};

function PreJoinCameraOffAvatar({
  initial,
  statusLine,
}: {
  initial: string;
  statusLine?: string | null;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <div className="lobby-preview__avatar" aria-hidden>
        <span>{initial}</span>
      </div>
      {statusLine ? (
        <p className="max-w-xs text-sm font-medium text-white/90">{statusLine}</p>
      ) : null}
    </div>
  );
}

function participantLabel(count: number) {
  if (count <= 0) return null;
  if (count === 1) return "1 person already in meeting";
  return `${count} people already in meeting`;
}

export function RoomPreJoinLobby({
  meetingTitle,
  meetingDescription,
  meetingTimerLabel,
  isTimerRunning = false,
  peersCount = 0,
  waitingPeerInitial,
  myStream,
  mediaError,
  isMicOn,
  isCameraOn,
  handleMicToggle,
  handleCameraToggle,
  onReadyToJoin,
}: RoomPreJoinLobbyProps) {
  const user = useCurrentSessionUser();
  const selfInitial = getFirstNameInitial(user?.username, user?.email);
  const userMediaAccessible = Boolean(myStream);
  const showLiveVideo = isCameraOn && Boolean(myStream);
  const timerDisplay = isTimerRunning ? (meetingTimerLabel ?? "00:00") : "00:00";
  const peersLabel = participantLabel(peersCount);

  const placeholderStatus = !userMediaAccessible && !mediaError
    ? "Requesting camera and microphone…"
    : !isCameraOn && isMicOn
      ? "Camera off — microphone on"
      : "Your meeting preview";

  return (
    <div className="lobby-page">
      <RoomPreJoinLobbyHeader
        meetingTitle={meetingTitle}
        meetingDescription={meetingDescription}
      />

      <div className="lobby-shell">
        <div className="lobby-card">
          <div className="lobby-preview-wrap">
            <div className="lobby-preview">
              {showLiveVideo ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  ref={(video) => {
                    if (video) video.srcObject = myStream;
                  }}
                />
              ) : (
                <PreJoinCameraOffAvatar
                  initial={selfInitial}
                  statusLine={
                    !userMediaAccessible && !mediaError
                      ? placeholderStatus
                      : !isCameraOn
                        ? null
                        : placeholderStatus
                  }
                />
              )}

              <div className="lobby-preview__badge lobby-preview__badge--status">
                <span className="lobby-preview__rec-dot" aria-hidden />
                <span>Waiting to join</span>
              </div>

              <button
                type="button"
                className="lobby-preview__menu"
                aria-label="More options"
                onClick={() => {}}
              >
                <MoreHorizontal className="h-5 w-5 text-white" strokeWidth={2} />
              </button>

              <div className="lobby-preview__controls">
                <button
                  type="button"
                  onClick={handleCameraToggle}
                  aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
                  className="lobby-preview__control-btn"
                >
                  <CameraIcon off={!isCameraOn} />
                </button>
                <button
                  type="button"
                  onClick={handleMicToggle}
                  aria-label={isMicOn ? "Turn microphone off" : "Turn microphone on"}
                  className="lobby-preview__control-btn"
                >
                  <MicIcon muted={!isMicOn} />
                </button>
              </div>

              <div className="lobby-preview__badge lobby-preview__badge--timer">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="font-mono text-sm font-semibold tabular-nums">{timerDisplay}</span>
              </div>
            </div>
          </div>

          {mediaError ? (
            <p className="lobby-card__error">
              {mediaError}. Allow access in your browser settings to continue.
            </p>
          ) : null}

          {peersLabel ? (
            <div className="lobby-card__presence">
              <span className="lobby-card__presence-avatar" aria-hidden>
                {waitingPeerInitial ?? "U"}
              </span>
              <span className="text-sm font-medium text-white">{peersLabel}</span>
            </div>
          ) : null}

          <div className="lobby-card__join-wrap">
            <button
              type="button"
              onClick={onReadyToJoin}
              disabled={!userMediaAccessible}
              className="lobby-join-btn"
            >
              <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--dash-forest)]" strokeWidth={2.5} aria-hidden />
              <span>Join</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
