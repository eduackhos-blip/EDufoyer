import { CameraIcon, MicIcon } from "./CallControlIcons";
import { RoomPreJoinLobbyHeader } from "./RoomPreJoinLobbyHeader";

export type RoomPreJoinLobbyProps = {
  roomId: string | undefined;
  meetingTimerLabel?: string | null;
  categorySessionLabel?: string | null;
  isTimerRunning?: boolean;
  myStream: MediaStream | null;
  mediaError: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  handleMicToggle: () => void;
  handleCameraToggle: () => void;
  onReadyToJoin: () => void;
};

const MEETING_PLACEHOLDER_SRC = "/waitingRoomImage.png";

function PreJoinMeetingPlaceholder({
  statusLine,
  showCameraHint = true,
}: {
  statusLine: string;
  showCameraHint?: boolean;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <div className="relative z-[2] flex max-w-[min(88%,20rem)] flex-col items-center gap-3">
        <img
          src={MEETING_PLACEHOLDER_SRC}
          alt=""
          aria-hidden
          className="h-auto max-h-[min(42vh,11rem)] w-auto max-w-full object-contain drop-shadow-[0_12px_28px_rgba(7,62,54,0.12)] sm:max-h-[12rem]"
          decoding="async"
        />
        <p className="text-sm font-medium text-[var(--dash-text-body)]">{statusLine}</p>
        {showCameraHint ? (
          <p className="max-w-xs text-xs leading-relaxed text-[var(--dash-text-muted)]">
            Turn your camera on when you are ready to be seen in the session.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RoomPreJoinLobby({
  roomId,
  meetingTimerLabel,
  categorySessionLabel,
  isTimerRunning,
  myStream,
  mediaError,
  isMicOn,
  isCameraOn,
  handleMicToggle,
  handleCameraToggle,
  onReadyToJoin,
}: RoomPreJoinLobbyProps) {
  const userMediaAccessible = Boolean(myStream);
  const showLiveVideo = isCameraOn && Boolean(myStream);

  const placeholderStatus = !userMediaAccessible && !mediaError
    ? "Requesting camera and microphone…"
    : !isCameraOn && isMicOn
      ? "Camera off — microphone on"
      : "Your meeting preview";

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-0.5rem)] w-full max-w-3xl flex-col gap-4 py-3 max-lg:px-2 sm:gap-6 sm:py-6 lg:min-h-[calc(100vh-2rem)] lg:gap-8 lg:py-8">
      <RoomPreJoinLobbyHeader
        roomId={roomId}
        meetingTimerLabel={meetingTimerLabel}
        categorySessionLabel={categorySessionLabel}
        isTimerRunning={isTimerRunning}
      />

      <div className="dash-panel-card relative overflow-hidden rounded-2xl lg:rounded-3xl">
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-4 top-4 z-[1] h-4 w-auto object-contain"
          decoding="async"
        />
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 z-[1] h-4 w-auto object-contain"
          decoding="async"
        />

        <div className="relative aspect-video w-full overflow-hidden bg-[var(--dash-card-mint)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255,255,255,0.9) 0%, transparent 72%)",
            }}
            aria-hidden
          />

          {showLiveVideo ? (
            <video
              autoPlay
              muted
              playsInline
              className="relative z-[2] h-full w-full object-cover"
              ref={(video) => {
                if (video) video.srcObject = myStream;
              }}
            />
          ) : (
            <PreJoinMeetingPlaceholder
              statusLine={placeholderStatus}
              showCameraHint={userMediaAccessible && !isCameraOn}
            />
          )}

          <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleMicToggle}
              aria-label={isMicOn ? "Turn microphone off" : "Turn microphone on"}
              className={`rounded-full border-2 px-5 py-2.5 text-sm font-medium shadow-[var(--dash-inner-shadow)] transition ${
                isMicOn
                  ? "border-[var(--dash-forest)] bg-white text-[var(--dash-forest)] hover:bg-[var(--dash-card-mint-alt)]"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <MicIcon muted={!isMicOn} />
            </button>
            <button
              type="button"
              onClick={handleCameraToggle}
              aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
              className={`rounded-full border-2 px-5 py-2.5 text-sm font-medium shadow-[var(--dash-inner-shadow)] transition ${
                isCameraOn
                  ? "border-[var(--dash-forest)] bg-white text-[var(--dash-forest)] hover:bg-[var(--dash-card-mint-alt)]"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <CameraIcon off={!isCameraOn} />
            </button>
          </div>
        </div>

        <div className="relative border-t border-[var(--dash-panel-border)] bg-white p-3 lg:p-6">
          {mediaError ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {mediaError}. Allow access in your browser settings to continue.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--dash-text-muted)]">
              {userMediaAccessible
                ? "When you are ready, join the room. Others will see you after you enter."
                : "Allow camera and microphone to join."}
            </p>
            <button
              type="button"
              onClick={onReadyToJoin}
              disabled={!userMediaAccessible}
              className="rounded-full bg-[#073E36] px-8 py-3 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition hover:bg-[#052f29] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ready to join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
