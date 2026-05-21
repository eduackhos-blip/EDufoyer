import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { useCurrentSessionUser } from "@/src/hooks/useCurrentSessionUser";
import type { RoomChatMessage } from "@/src/hooks/useRoomChat";
import { CameraIcon, MicIcon, ScreenShareIcon } from "./CallControlIcons";
import { ChatSidebarContent } from "./ChatSidebarContent";
import { getFirstNameInitial } from "@/src/lib/userInitial";
import { MeetWaitingForPeer } from "./MeetWaitingForPeer";
import { MeetingSessionHeader } from "./MeetingSessionHeader";

type RemoteUser = { userId: string; username: string; email: string };

export type RoomCallSessionProps = {
  meetingTitle: string;
  meetingDescription: string;
  isRemoteMicEnabled: boolean;
  isRemoteCameraEnabled: boolean;
  remoteAudioStream: MediaStream | null;
  remoteVideoStream: MediaStream | null;
  remoteScreenShareStream: MediaStream | null;
  localScreenShareStream?: MediaStream | null;
  remoteUser: RemoteUser | null;
  remoteStream: MediaStream | null;
  remoteSocketId: string | null;
  hasLiveRemoteVideo: boolean;
  myStream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  handleMicToggle: () => void;
  handleCameraToggle: () => void;
  isScreenSharing: boolean;
  onScreenShareClick: () => void;
  onLeaveClick: () => void;
  meetingTimerLabel?: string | null;
  isTimerRunning?: boolean;
  showAskerGraceBanner?: boolean;
  askerGraceLabel?: string | null;
  showAskerReconnectBanner?: boolean;
  showSolverReconnectBanner?: boolean;
  messages: RoomChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleChatSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function isRemoteMicLive(remoteAudioStream: MediaStream | null) {
  return Boolean(remoteAudioStream?.getAudioTracks().some((t) => t.enabled && t.readyState === "live"));
}

export function RoomCallSession({
  meetingTitle,
  meetingDescription,
  isRemoteMicEnabled: _isRemoteMicEnabled,
  isRemoteCameraEnabled,
  remoteAudioStream,
  remoteVideoStream,
  remoteScreenShareStream,
  localScreenShareStream = null,
  remoteUser,
  remoteStream: _remoteStream,
  remoteSocketId,
  hasLiveRemoteVideo,
  myStream,
  isMicOn,
  isCameraOn,
  handleMicToggle,
  handleCameraToggle,
  isScreenSharing,
  onScreenShareClick,
  onLeaveClick,
  meetingTimerLabel,
  isTimerRunning = false,
  showAskerGraceBanner,
  askerGraceLabel,
  showAskerReconnectBanner,
  showSolverReconnectBanner,
  messages,
  chatInput,
  setChatInput,
  handleChatSubmit,
}: RoomCallSessionProps) {
  const user = useCurrentSessionUser();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [showSelfMenu, setShowSelfMenu] = useState(false);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const selfMenuRef = useRef<HTMLDivElement | null>(null);

  const activeScreenShareStream = remoteScreenShareStream ?? localScreenShareStream;
  const isScreenShareLayout = Boolean(activeScreenShareStream);
  const screenShareLabel = remoteScreenShareStream
    ? `${remoteUser?.username?.trim() || "Participant"}'s screen`
    : "Your screen";

  useEffect(() => {
    if (!isMobileChatOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileChatOpen]);

  useEffect(() => {
    if (!screenShareVideoRef.current || !activeScreenShareStream) return;
    if (screenShareVideoRef.current.srcObject !== activeScreenShareStream) {
      screenShareVideoRef.current.srcObject = activeScreenShareStream;
    }
  }, [activeScreenShareStream]);

  const showRemoteVideo = Boolean(remoteVideoStream && hasLiveRemoteVideo && isRemoteCameraEnabled);

  useEffect(() => {
    if (!remoteVideoRef.current) return;
    if (showRemoteVideo && remoteVideoStream) {
      if (remoteVideoRef.current.srcObject !== remoteVideoStream) {
        remoteVideoRef.current.srcObject = remoteVideoStream;
      }
    } else {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteVideoStream, showRemoteVideo]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !myStream || !isCameraOn) return;
    if (el.srcObject !== myStream) {
      el.srcObject = myStream;
    }
    void el.play().catch(() => {
      /* autoplay policies may block until user gesture */
    });
  }, [myStream, isCameraOn]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    if (remoteAudioRef.current.srcObject !== remoteAudioStream) {
      remoteAudioRef.current.srcObject = remoteAudioStream;
    }
  }, [remoteAudioStream]);

  useEffect(() => {
    if (!isMobileChatOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileChatOpen]);

  useEffect(() => {
    if (!showSelfMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (selfMenuRef.current && !selfMenuRef.current.contains(event.target as Node)) {
        setShowSelfMenu(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [showSelfMenu]);

  const remoteMicLive = isRemoteMicLive(remoteAudioStream);
  const localInitial = getFirstNameInitial(user?.username, user?.email);
  const remoteInitial = getFirstNameInitial(remoteUser?.username, remoteUser?.email);
  const remoteName = remoteUser?.username?.trim() || remoteUser?.email?.split("@")[0] || "Guest";
  const timerDisplay = isTimerRunning ? (meetingTimerLabel ?? "00:00") : (meetingTimerLabel ?? "00:00");
  const isPeerReconnectGrace = Boolean(showAskerGraceBanner && askerGraceLabel);
  const isWaitingForPeer = isPeerReconnectGrace || !remoteSocketId;
  const waitCountdownLabel = isPeerReconnectGrace ? askerGraceLabel : null;

  const renderRemoteParticipant = (tileClass = "meet-remote") => (
    <div className={`${tileClass}${isWaitingForPeer ? " meet-remote--waiting" : ""}`}>
      {isWaitingForPeer ? (
        <MeetWaitingForPeer
          countdownLabel={waitCountdownLabel}
          participantName={remoteSocketId ? remoteName : undefined}
        />
      ) : showRemoteVideo ? (
        <video autoPlay playsInline className="meet-remote__video" ref={remoteVideoRef} />
      ) : (
        <div className="meet-remote__avatar" aria-label={`${remoteName} — camera off`}>
          <span className="meet-remote__avatar-initial">{remoteInitial}</span>
        </div>
      )}
      {remoteSocketId ? (
        <>
          <span className="meet-pill meet-pill--tl">{remoteName}</span>
          <div
            className={`meet-overlay-btn meet-overlay-btn--tr ${remoteMicLive ? "" : "meet-overlay-btn--muted"}`}
            aria-label={remoteMicLive ? "Microphone on" : "Microphone muted"}
          >
            <MicIcon muted={!remoteMicLive} />
          </div>
        </>
      ) : null}
    </div>
  );

  const renderSelfParticipant = (tileClass = "meet-self") => (
    <div className={tileClass}>
      {isCameraOn && myStream ? (
        <video autoPlay muted playsInline className="meet-self__video" ref={localVideoRef} />
      ) : (
        <div className="meet-self__avatar" aria-label={`Camera off — ${localInitial}`}>
          <span>{localInitial}</span>
        </div>
      )}
      <span className="meet-pill meet-pill--tl">You</span>
      <div className="meet-self__menu-wrap" ref={selfMenuRef}>
        <button
          type="button"
          className="meet-overlay-btn meet-overlay-btn--tr"
          aria-label="More options"
          aria-expanded={showSelfMenu}
          onClick={() => setShowSelfMenu((v) => !v)}
        >
          <MoreHorizontal className="h-5 w-5 text-white" strokeWidth={2} />
        </button>
        {showSelfMenu ? (
          <div className="meet-self__menu">
            <button
              type="button"
              className="meet-self__menu-item meet-self__menu-item--danger"
              onClick={() => {
                setShowSelfMenu(false);
                onLeaveClick();
              }}
            >
              Leave meeting
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const chatPanel = (className: string, showClose = false) => (
    <div className={className}>
      <ChatSidebarContent
        messages={messages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleChatSubmit={handleChatSubmit}
        userId={user?.id}
        variant="meeting"
        isPeerOnline={Boolean(remoteSocketId) && !isPeerReconnectGrace}
        onClose={showClose ? () => setIsMobileChatOpen(false) : undefined}
      />
    </div>
  );

  let mainContent: ReactNode;

  if (isScreenShareLayout) {
    mainContent = (
      <div className={`meet-body meet-body--screenshare`}>
        <section className="meet-screenshare-main">
          <span className="meet-pill meet-pill--overlay">{screenShareLabel}</span>
          <video
            autoPlay
            playsInline
            className="meet-screenshare-main__video"
            ref={screenShareVideoRef}
          />
        </section>

        <aside className="meet-side meet-side--screenshare">
          <div className="meet-participant-stack">
            {renderRemoteParticipant("meet-participant-tile")}
            {renderSelfParticipant("meet-participant-tile meet-participant-tile--self")}
          </div>
          {chatPanel("meet-side__chat hidden min-h-0 lg:flex")}
        </aside>

        <button
          type="button"
          onClick={() => setIsMobileChatOpen(true)}
          className="meet-mobile-chat-btn meet-mobile-chat-btn--screenshare lg:hidden"
          aria-expanded={isMobileChatOpen}
          aria-controls="mobile-chat-drawer"
        >
          Messages
        </button>

        <audio autoPlay ref={remoteAudioRef} />
      </div>
    );
  } else {
    mainContent = (
      <div className="meet-body">
        <section className="meet-main">
          {renderRemoteParticipant()}
          <button
            type="button"
            onClick={() => setIsMobileChatOpen(true)}
            className="meet-mobile-chat-btn lg:hidden"
            aria-expanded={isMobileChatOpen}
            aria-controls="mobile-chat-drawer"
          >
            Messages
          </button>
          <audio autoPlay ref={remoteAudioRef} />
        </section>

        <aside className="meet-side">
          {renderSelfParticipant()}
          {chatPanel("meet-side__chat hidden min-h-0 lg:flex")}
        </aside>
      </div>
    );
  }

  return (
    <div className="meet-page">
      <MeetingSessionHeader
        meetingTitle={meetingTitle}
        meetingDescription={meetingDescription}
        meetingTimerLabel={timerDisplay}
        onExitClick={onLeaveClick}
      />

      {showAskerReconnectBanner ? (
        <div className="mx-4 mb-3 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-sm text-sky-900 md:mx-6">
          <p className="font-medium">Waiting for asker to reconnect</p>
          <p className="mt-1 text-sky-800/90">
            The asker may have reloaded the page or has a temporary connection issue. Please stay on
            this page — the session will continue if they return shortly.
          </p>
        </div>
      ) : null}

      {showSolverReconnectBanner ? (
        <div className="mx-4 mb-3 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-sm text-violet-900 md:mx-6">
          <p className="font-medium">Waiting for solver to reconnect</p>
          <p className="mt-1 text-violet-800/90">
            Your solver may have reloaded the page or has a temporary connection issue. Please stay
            on this page — the session will continue if they return shortly.
          </p>
        </div>
      ) : null}

      {showAskerGraceBanner && askerGraceLabel ? (
        <div className="mx-4 mb-3 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-950 md:mx-6">
          <p className="font-medium">Asker left the meeting</p>
          <p className="mt-1 text-amber-900/90">
            Please stay on this page. If they do not rejoin within{" "}
            <span className="font-mono font-semibold">{askerGraceLabel}</span>, the session will end.
            If you leave before then, wallet credit may not be applied.
          </p>
          <p className="mt-1 text-xs text-amber-800/80">
            If the asker rejoins in time, the session continues as usual.
          </p>
        </div>
      ) : null}

      {mainContent}

      <div className="meet-floating-controls" role="toolbar" aria-label="Meeting controls">
        <button
          type="button"
          onClick={handleMicToggle}
          aria-label={isMicOn ? "Turn microphone off" : "Turn microphone on"}
          className={`meet-control-btn ${isMicOn ? "" : "meet-control-btn--off"}`}
        >
          <MicIcon muted={!isMicOn} />
        </button>
        <button
          type="button"
          onClick={handleCameraToggle}
          aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
          className={`meet-control-btn ${isCameraOn ? "" : "meet-control-btn--off"}`}
        >
          <CameraIcon off={!isCameraOn} />
        </button>
        <button
          type="button"
          onClick={onScreenShareClick}
          aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          className={`meet-control-btn ${isScreenSharing ? "meet-control-btn--active" : ""}`}
        >
          <ScreenShareIcon active={isScreenSharing} />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-out lg:hidden ${
          isMobileChatOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isMobileChatOpen}
      >
        <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close chat" onClick={() => setIsMobileChatOpen(false)} />
      </div>

      <aside
        id="mobile-chat-drawer"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] transition-transform duration-300 ease-out lg:hidden ${
          isMobileChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMobileChatOpen}
      >
        <div className="h-full min-h-0 flex flex-col">{chatPanel("flex min-h-0 flex-1 flex-col", true)}</div>
      </aside>
    </div>
  );
}
