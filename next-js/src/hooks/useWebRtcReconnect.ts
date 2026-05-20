import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { peer } from "@/src/lib/webrtc/peer";
import { SOCKET_EVENTS } from "@/src/socket/events";

type UseWebRtcReconnectParams = {
  socket: Socket | null;
  enabled: boolean;
  isSolver: boolean;
  isAsker: boolean;
  onReset: () => void;
};

/** Tear down WebRTC when the remote peer briefly disconnects (reload / network blip). */
export function useWebRtcReconnect({
  socket,
  enabled,
  isSolver,
  isAsker,
  onReset,
}: UseWebRtcReconnectParams) {
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleSolverDisconnected = () => {
      if (!isAsker) return;
      onReset();
    };

    const handleAskerDisconnected = () => {
      if (!isSolver) return;
      onReset();
    };

    socket.on(SOCKET_EVENTS.SESSION_SOLVER_DISCONNECTED, handleSolverDisconnected);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_DISCONNECTED, handleAskerDisconnected);

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_SOLVER_DISCONNECTED, handleSolverDisconnected);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_DISCONNECTED, handleAskerDisconnected);
    };
  }, [socket, enabled, isSolver, isAsker, onReset]);
}
