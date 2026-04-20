import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../socket/events";

type UseJoinRoomParams = {
  roomId?: string;
  socket: Socket | null;
  initiateConnection?: boolean;
};

export const useJoinRoom = ({ roomId, socket, initiateConnection = true }: UseJoinRoomParams) => {
  useEffect(() => {
    if (!initiateConnection || !roomId || !socket) return;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
  }, [roomId, socket, initiateConnection]);
};
