import { useCallback, useEffect, useRef, useState } from "react";
import { peer } from "../lib/webrtc/peer";

type UseRemoteTrackListenerParams = {
  remoteSocketId: string | null;
  /** Re-bind when peer connection is recreated after reconnect. */
  peerConnectionEpoch?: number;
};

function isRemoteScreenShareTrack(track: MediaStreamTrack): boolean {
  if (track.kind !== "video") return false;

  const settings = track.getSettings() as MediaTrackSettings & { displaySurface?: string };
  if (settings.displaySurface) return true;

  const label = track.label.toLowerCase();
  return (
    label.includes("screen") || label.includes("window") || label.includes("display") || label.includes("entire") || label.includes("tab")
  );
}

type UseRemoteTrackListenerResult = {
  remoteStream: MediaStream | null;
  remoteAudioStream: MediaStream | null;
  remoteVideoStream: MediaStream | null;
  remoteScreenShareStream: MediaStream | null;
  clearRemoteScreenShare: () => void;
};

export const useRemoteTrackListener = ({
  remoteSocketId,
  peerConnectionEpoch = 0,
}: UseRemoteTrackListenerParams): UseRemoteTrackListenerResult => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
  const [remoteScreenShareStream, setRemoteScreenShareStream] = useState<MediaStream | null>(null);
  const remoteCameraTrackRef = useRef<MediaStreamTrack | null>(null);

  const handleRemoteStream = useCallback((event: RTCTrackEvent) => {
    const incomingRemoteStream = event.streams[0];
    if (!incomingRemoteStream) return;

    setRemoteStream(incomingRemoteStream);
    const track = event.track;

    if (track.kind === "audio") {
      setRemoteAudioStream(new MediaStream([track]));
      const onEnded = () => {
        track.removeEventListener("ended", onEnded);
        setRemoteAudioStream((prev) => (prev?.getAudioTracks()[0]?.id === track.id ? null : prev));
      };
      track.addEventListener("ended", onEnded);
      return;
    }

    if (track.kind === "video") {
      if (isRemoteScreenShareTrack(track)) {
        setRemoteScreenShareStream(new MediaStream([track]));
        const onEnded = () => {
          track.removeEventListener("ended", onEnded);
          setRemoteScreenShareStream((prev) => (prev?.getVideoTracks()[0]?.id === track.id ? null : prev));
        };
        track.addEventListener("ended", onEnded);
        return;
      }

      const prevCamera = remoteCameraTrackRef.current;
      if (prevCamera && prevCamera.id !== track.id && prevCamera.readyState === "live") {
        setRemoteScreenShareStream(new MediaStream([track]));
        const onEnded = () => {
          track.removeEventListener("ended", onEnded);
          setRemoteScreenShareStream((prev) => (prev?.getVideoTracks()[0]?.id === track.id ? null : prev));
        };
        track.addEventListener("ended", onEnded);
        return;
      }

      remoteCameraTrackRef.current = track;
      setRemoteVideoStream(new MediaStream([track]));
      const onEnded = () => {
        track.removeEventListener("ended", onEnded);
        if (remoteCameraTrackRef.current?.id === track.id) {
          remoteCameraTrackRef.current = null;
        }
        setRemoteVideoStream((prev) => (prev?.getVideoTracks()[0]?.id === track.id ? null : prev));
      };
      track.addEventListener("ended", onEnded);
    }
  }, []);

  const clearRemoteScreenShare = useCallback(() => {
    setRemoteScreenShareStream(null);
  }, []);

  const clearRemoteMedia = useCallback(() => {
    remoteCameraTrackRef.current = null;
    setRemoteStream(null);
    setRemoteAudioStream(null);
    setRemoteVideoStream(null);
    setRemoteScreenShareStream(null);
  }, []);

  useEffect(() => {
    if (!remoteSocketId) {
      clearRemoteMedia();
    }
  }, [remoteSocketId, clearRemoteMedia]);

  useEffect(() => {
    const pc = peer.peer;
    if (!pc) return;
    pc.addEventListener("track", handleRemoteStream);
    return () => {
      pc.removeEventListener("track", handleRemoteStream);
    };
  }, [handleRemoteStream, remoteSocketId, peerConnectionEpoch]);

  return {
    remoteStream,
    remoteAudioStream,
    remoteVideoStream,
    remoteScreenShareStream,
    clearRemoteScreenShare,
    clearRemoteMedia,
  };
};
