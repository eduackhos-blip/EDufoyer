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
import { useJoinRoom } from "@/src/hooks/useJoinRoom";
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

function resolveRoomId(rawParams: Record<string, string | string[] | undefined>) {
  const raw = rawParams.roomId ?? rawParams.id ?? rawParams.doubtId;
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export default function RoomPage() {
  const params = useParams() as Record<string, string | string[] | undefined>;
  const roomId = useMemo(() => resolveRoomId(params), [params]);
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

  useJoinRoom({ roomId, socket: activeSocket, initiateConnection });
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
    if (isScreenSharing) {
      stopScreenShare();
    }
    peer.closeConnection();
    setShowLeaveModal(false);
    router.push("/dashboard");
  }, [isScreenSharing, router, stopScreenShare]);

  return (
    <main className="min-h-[100dvh] bg-slate-950 px-1.5 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] text-slate-100 lg:p-4 lg:pb-4 lg:pt-4">
      {showLobbyScreen ? (
        <RoomPreJoinLobby
          roomId={roomId}
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
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSubmit={handleChatSubmit}
        />
      )}

      {showLeaveModal ? <LeaveCallModal onCancel={handleDismissLeaveModal} onConfirm={handleConfirmLeave} /> : null}
    </main>
  );
}
