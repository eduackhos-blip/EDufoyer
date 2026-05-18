"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { peer } from "@/src/lib/webrtc/peer";
import { LeaveCallModal } from "@/src/components/room/LeaveCallModal";
import { RoomCallSession } from "@/src/components/room/RoomCallSession";
import { RoomPreJoinLobby } from "@/src/components/room/RoomPreJoinLobby";
import { useSocket } from "@/src/contexts/SocketContext";
import { useScreenShare } from "@/src/hooks/useScreenShare";
import { useIceCandidateListener } from "@/src/hooks/useIceCandidateListener";
import { useSessionMeeting } from "@/src/hooks/useSessionMeeting";
import { useNegotiationNeeded } from "@/src/hooks/useNegotiationNeeded";
import { useNegotiationNeededAnswer } from "@/src/hooks/useNegotiationNeededAnswer";
import { useNegotiationRemoteAnswer } from "@/src/hooks/useNegotiationRemoteAnswer";
import { useLocalMediaStream } from "@/src/hooks/useLocalMediaStream";
import { useOtherPersonJoined } from "@/src/hooks/useOtherPersonJoined";
import { useRemoteTrackListener } from "@/src/hooks/useRemoteTrackListener";
import { useScreenShareStopListener } from "@/src/hooks/useScreenShareStopListener";
import { useRoomChat } from "@/src/hooks/useRoomChat";
import { useRoomJoinedConfirmation } from "@/src/hooks/useRoomJoinedConfirmation";
import { useUserPreferences } from "@/src/hooks/useUserPreferences";
import { useWebRtcAnswer } from "@/src/hooks/useWebRtcAnswer";
import { useWebRtcIceCandidate } from "@/src/hooks/useWebRtcIceCandidate";
import { useWebRtcOffer } from "@/src/hooks/useWebRtcOffer";
import { useResolvedSessionRoomId } from "@/src/hooks/useResolvedSessionRoomId";
import { useSolverLeftRating } from "@/src/hooks/useSolverLeftRating";
import { SessionRoomUnavailable } from "@/src/components/sessions/SessionRoomUnavailable";
import { SolverLeftRatingModal } from "@/src/components/sessions/SolverLeftRatingModal";

function resolveRouteParam(rawParams: Record<string, string | string[] | undefined>) {
  const raw = rawParams.roomId ?? rawParams.id ?? rawParams.doubtId;
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export default function RoomPage() {
  const params = useParams() as Record<string, string | string[] | undefined>;
  const routeParam = useMemo(() => resolveRouteParam(params), [params]);
  const {
    roomId,
    parsed,
    maxSessionSeconds,
    isResolving,
    resolveError,
    roomUnavailable,
    roomUnavailableCode,
  } = useResolvedSessionRoomId(routeParam);
  const router = useRouter();
  const { socket, connectSocket } = useSocket();
  const activeSocket = socket ?? connectSocket();

  const [showLobbyScreen, setShowLobbyScreen] = useState<boolean>(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const initiateConnection = !showLobbyScreen;

  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const { isScreenSharing, toggleScreenShare, stopScreenShare } = useScreenShare({
    roomId,
    toSocketId: remoteSocketId,
  });
  const [remoteUser, setRemoteUser] = useState<{ userId: string; username: string; email: string } | null>(null);

  const { myStream, mediaError } = useLocalMediaStream();
  const { isMicOn, isCameraOn, handleMicToggle, handleCameraToggle } = useUserPreferences(myStream);

  const sessionMeeting = useSessionMeeting({
    roomId,
    socket: activeSocket,
    initiateConnection,
    maxSessionSecondsFromRoom: maxSessionSeconds,
  });

  const handleSolverLeftSessionEnd = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    peer.closeConnection();
  }, [isScreenSharing, stopScreenShare]);

  const solverLeftRating = useSolverLeftRating({
    socket: activeSocket,
    isAsker: sessionMeeting.isAsker,
    doubtId: parsed?.doubtId,
    onSessionEnd: handleSolverLeftSessionEnd,
  });

  useRoomJoinedConfirmation(activeSocket);
  useOtherPersonJoined(activeSocket, setRemoteSocketId, setRemoteUser, myStream);
  useWebRtcOffer(activeSocket, myStream, setRemoteSocketId, setRemoteUser);
  useWebRtcAnswer(activeSocket);
  useNegotiationNeededAnswer(activeSocket);
  useNegotiationRemoteAnswer(activeSocket);
  useNegotiationNeeded({ socket: activeSocket, roomId, remoteSocketId, enabled: initiateConnection });
  useWebRtcIceCandidate(activeSocket);
  useIceCandidateListener({ socket: activeSocket, roomId, remoteSocketId });

  const { remoteStream, remoteAudioStream, remoteVideoStream, remoteScreenShareStream, clearRemoteScreenShare } =
    useRemoteTrackListener({ remoteSocketId });

  useScreenShareStopListener({
    socket: activeSocket,
    roomId,
    remoteSocketId,
    onRemoteScreenShareStopped: clearRemoteScreenShare,
  });

  const { messages, chatInput, setChatInput, handleChatSubmit } = useRoomChat(activeSocket, roomId);

  const hasLiveRemoteVideo = Boolean(remoteVideoStream?.getVideoTracks().some((track) => track.enabled && track.readyState === "live"));
  const isRemoteMicEnabled = remoteAudioStream?.getAudioTracks()[0]?.enabled ?? false;
  const isRemoteCameraEnabled = remoteVideoStream?.getVideoTracks()[0]?.enabled ?? false;

  const handleReadyToJoin = useCallback(() => {
    setShowLobbyScreen(false);
  }, []);

  const handleLeaveRequest = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  const handleDismissLeaveModal = useCallback(() => {
    setShowLeaveModal(false);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    sessionMeeting.emitParticipantLeave();
    if (isScreenSharing) {
      stopScreenShare();
    }
    peer.closeConnection();
    setShowLeaveModal(false);
    router.push("/dashboard");
  }, [isScreenSharing, router, stopScreenShare, sessionMeeting]);

  if (isResolving) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-sm">Loading session…</p>
      </main>
    );
  }

  if (roomUnavailable) {
    const ended = roomUnavailableCode === "room_closed";
    return (
      <SessionRoomUnavailable
        title={ended ? "This session has ended" : "This session is no longer available"}
        message={
          ended
            ? "This meeting room was closed after the session finished. Head back to your dashboard to start or join a new doubt."
            : "This meeting link may have expired or was never created. If a solver has not accepted your doubt yet, wait for acceptance and use the link from your dashboard."
        }
      />
    );
  }

  if (resolveError || !roomId) {
    return (
      <SessionRoomUnavailable
        title="We could not open this session"
        message={resolveError ?? "This link does not look like a valid session. Open it from your dashboard instead."}
      />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-950 px-1.5 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] text-slate-100 lg:p-4 lg:pb-4 lg:pt-4">
      {showLobbyScreen ? (
        <RoomPreJoinLobby
          roomId={roomId}
          meetingTimerLabel={sessionMeeting.meetingTimerLabel}
          categorySessionLabel={sessionMeeting.categorySessionLabel}
          isTimerRunning={sessionMeeting.isTimerRunning}
          myStream={myStream}
          mediaError={mediaError}
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          handleMicToggle={handleMicToggle}
          handleCameraToggle={handleCameraToggle}
          onReadyToJoin={handleReadyToJoin}
        />
      ) : (
        <RoomCallSession
          roomId={roomId}
          isRemoteMicEnabled={isRemoteMicEnabled}
          isRemoteCameraEnabled={isRemoteCameraEnabled}
          remoteAudioStream={remoteAudioStream}
          remoteVideoStream={remoteVideoStream}
          remoteScreenShareStream={remoteScreenShareStream}
          remoteUser={remoteUser}
          remoteStream={remoteStream}
          remoteSocketId={remoteSocketId}
          hasLiveRemoteVideo={hasLiveRemoteVideo}
          myStream={myStream}
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          handleMicToggle={handleMicToggle}
          handleCameraToggle={handleCameraToggle}
          isScreenSharing={isScreenSharing}
          onScreenShareClick={toggleScreenShare}
          onLeaveClick={handleLeaveRequest}
          meetingTimerLabel={sessionMeeting.meetingTimerLabel}
          categorySessionLabel={sessionMeeting.categorySessionLabel}
          isTimerRunning={sessionMeeting.isTimerRunning}
          showAskerGraceBanner={sessionMeeting.showAskerGraceBanner}
          askerGraceLabel={sessionMeeting.askerGraceLabel}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSubmit={handleChatSubmit}
        />
      )}

      {showLeaveModal ? (
        <LeaveCallModal
          variant={sessionMeeting.isSolver ? "solver" : "default"}
          onCancel={handleDismissLeaveModal}
          onConfirm={handleConfirmLeave}
        />
      ) : null}

      {solverLeftRating.showRatingModal && solverLeftRating.ratingDoubtId ? (
        <SolverLeftRatingModal
          open={solverLeftRating.showRatingModal}
          doubtId={solverLeftRating.ratingDoubtId}
          message={solverLeftRating.ratingMessage}
          systemRating={solverLeftRating.systemRating}
          attendancePercent={solverLeftRating.attendancePercent}
          submitting={solverLeftRating.submitting}
          onSubmit={async (rating, comment) => {
            const ok = await solverLeftRating.submitRating(rating, comment);
            if (ok) router.push("/dashboard");
          }}
        />
      ) : null}
    </main>
  );
}
