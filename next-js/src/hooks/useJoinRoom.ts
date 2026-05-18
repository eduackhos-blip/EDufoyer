import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../socket/events";

type UseJoinRoomParams = {
  roomId?: string;
  socket: Socket | null;
  initiateConnection?: boolean;
  plannedSeconds?: number;
};

/** @deprecated Session join is handled in useSessionMeeting (includes plannedSeconds). */
export const useJoinRoom = ({
  roomId,
  socket,
  initiateConnection = true,
  plannedSeconds,
}: UseJoinRoomParams) => {
  useEffect(() => {
    if (!initiateConnection || !roomId || !socket) return;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomId,
      ...(plannedSeconds ? { plannedSeconds } : {}),
    });
  }, [roomId, socket, initiateConnection, plannedSeconds]);
};
