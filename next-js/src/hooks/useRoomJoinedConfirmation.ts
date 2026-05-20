import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_EVENTS } from "../socket/events";

type RoomJoinedPayload = { roomId: string };
type RoomErrorPayload = { message?: string };

export const useRoomJoinedConfirmation = (
  socket: Socket | null,
  showJoinToast = true
) => {
  useEffect(() => {
    if (!socket) return;

    const handleRoomJoinedConfirmation = (_payload: RoomJoinedPayload) => {
      if (showJoinToast) {
        toast.success("You joined the room successfully");
      }
    };

    const handleRoomError = (payload: RoomErrorPayload) => {
      const message = payload?.message?.trim() || "Could not join this room.";
      toast.error(message);
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED_CONFIRMATION, handleRoomJoinedConfirmation);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED_CONFIRMATION, handleRoomJoinedConfirmation);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    };
  }, [socket, showJoinToast]);
};

