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
    label.includes("screen") ||
    label.includes("window") ||
    label.includes("display") ||
    label.includes("entire") ||
    label.includes("tab")
  );
}

function isCameraVideoTrackActive(track: MediaStreamTrack | null | undefined) {
  if (!track || track.kind !== "video") return false;
  return track.readyState === "live" && track.enabled && !track.muted;
}

type UseRemoteTrackListenerResult = {
  remoteStream: MediaStream | null;
  remoteAudioStream: MediaStream | null;
  remoteVideoStream: MediaStream | null;
  remoteScreenShareStream: MediaStream | null;
  isRemoteCameraEnabled: boolean;
  clearRemoteScreenShare: () => void;
  clearRemoteMedia: () => void;
};

export const useRemoteTrackListener = ({
  remoteSocketId,
  peerConnectionEpoch = 0,
}: UseRemoteTrackListenerParams): UseRemoteTrackListenerResult => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
  const [remoteScreenShareStream, setRemoteScreenShareStream] = useState<MediaStream | null>(null);
  const [isRemoteCameraEnabled, setIsRemoteCameraEnabled] = useState(false);
  const remoteCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackCleanupRef = useRef<(() => void) | null>(null);

  const detachCameraTrackListeners = useCallback(() => {
    cameraTrackCleanupRef.current?.();
    cameraTrackCleanupRef.current = null;
    remoteCameraTrackRef.current = null;
    setIsRemoteCameraEnabled(false);
  }, []);

  const attachCameraTrackListeners = useCallback((track: MediaStreamTrack) => {
    detachCameraTrackListeners();
    remoteCameraTrackRef.current = track;

    const sync = () => {
      setIsRemoteCameraEnabled(isCameraVideoTrackActive(track));
    };

    sync();
    track.addEventListener("mute", sync);
    track.addEventListener("unmute", sync);
    track.addEventListener("ended", sync);

    cameraTrackCleanupRef.current = () => {
      track.removeEventListener("mute", sync);
      track.removeEventListener("unmute", sync);
      track.removeEventListener("ended", sync);
    };
  }, [detachCameraTrackListeners]);

  const handleRemoteStream = useCallback(
    (event: RTCTrackEvent) => {
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
            setRemoteScreenShareStream((prev) =>
              prev?.getVideoTracks()[0]?.id === track.id ? null : prev
            );
          };
          track.addEventListener("ended", onEnded);
          return;
        }

        const prevCamera = remoteCameraTrackRef.current;
        if (prevCamera && prevCamera.id !== track.id && prevCamera.readyState === "live") {
          setRemoteScreenShareStream(new MediaStream([track]));
          const onEnded = () => {
            track.removeEventListener("ended", onEnded);
            setRemoteScreenShareStream((prev) =>
              prev?.getVideoTracks()[0]?.id === track.id ? null : prev
            );
          };
          track.addEventListener("ended", onEnded);
          return;
        }

        setRemoteVideoStream(new MediaStream([track]));
        attachCameraTrackListeners(track);

        const onEnded = () => {
          track.removeEventListener("ended", onEnded);
          if (remoteCameraTrackRef.current?.id === track.id) {
            detachCameraTrackListeners();
          }
          setRemoteVideoStream((prev) => (prev?.getVideoTracks()[0]?.id === track.id ? null : prev));
        };
        track.addEventListener("ended", onEnded);
      }
    },
    [attachCameraTrackListeners, detachCameraTrackListeners]
  );

  const clearRemoteScreenShare = useCallback(() => {
    setRemoteScreenShareStream(null);
  }, []);

  const clearRemoteMedia = useCallback(() => {
    detachCameraTrackListeners();
    setRemoteStream(null);
    setRemoteAudioStream(null);
    setRemoteVideoStream(null);
    setRemoteScreenShareStream(null);
  }, [detachCameraTrackListeners]);

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

  useEffect(() => {
    if (!remoteSocketId) {
      detachCameraTrackListeners();
      setRemoteStream(null);
      setRemoteAudioStream(null);
      setRemoteVideoStream(null);
      setRemoteScreenShareStream(null);
    }
  }, [remoteSocketId, detachCameraTrackListeners]);

  useEffect(() => () => detachCameraTrackListeners(), [detachCameraTrackListeners]);

  return {
    remoteStream,
    remoteAudioStream,
    remoteVideoStream,
    remoteScreenShareStream,
    isRemoteCameraEnabled,
    clearRemoteScreenShare,
    clearRemoteMedia,
  };
};
