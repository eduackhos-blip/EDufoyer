"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/src/socket/events";

export type LobbyPeer = {
  socketId: string;
  user: { userId: string; username: string; email: string };
};

type OtherPersonJoinedPayload = {
  roomId: string;
  joinedSocketId: string;
  isExistingParticipant?: boolean;
  user: LobbyPeer["user"];
};

export function useLobbyRoomPresence({
  roomId,
  socket,
  enabled,
}: {
  roomId?: string;
  socket: Socket | null;
  enabled: boolean;
}) {
  const [peersInRoom, setPeersInRoom] = useState<LobbyPeer[]>([]);

  useEffect(() => {
    if (!enabled || !roomId || !socket) {
      setPeersInRoom([]);
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, lobbyOnly: true });

    const onOtherJoined = (payload: OtherPersonJoinedPayload) => {
      if (payload.roomId !== roomId) return;
      setPeersInRoom((prev) => {
        if (prev.some((p) => p.user.userId === payload.user.userId)) return prev;
        return [
          ...prev,
          { socketId: payload.joinedSocketId, user: payload.user },
        ];
      });
    };

    socket.on(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);
    return () => {
      socket.off(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);
      setPeersInRoom([]);
    };
  }, [roomId, socket, enabled]);

  return {
    peersInRoom,
    peersCount: peersInRoom.length,
  };
}
