import type { Server, Socket } from "socket.io";
import { config } from "../../config";
import { parseSessionRoomId, resolveMaxSessionSeconds } from "../../lib/roomId";
import { Doubt } from "../../models/Doubt";
import { Room } from "../../models/Room";
import { SOCKET_EVENTS } from "../events";

const DISCONNECT_GRACE_MS = 15_000;
const ROOM_ID_PATTERN = /^doubt-([a-fA-F0-9]{24})-solver-([a-fA-F0-9]{24})$/;

/** roomId → true while this session is being finalized (blocks duplicate runs). */
const finalizingRooms = new Map<string, boolean>();

function isUserStillInRoom(io: Server, roomId: string, userId: string) {
  const memberIds = io.sockets.adapter.rooms.get(roomId);
  if (!memberIds) return false;

  for (const socketId of memberIds) {
    const peer = io.sockets.sockets.get(socketId);
    if (peer && String(peer.user.userId) === String(userId)) {
      return true;
    }
  }
  return false;
}

type SessionEndReason = "solver_left" | "asker_left_timeout" | "solver_left_during_asker_grace";

type JoinRoomPayload = {
  roomId?: string;
};

type LeaveRoomPayload = {
  roomId?: string;
  elapsedSeconds?: number;
  /** Solver only: end session because asker did not return within grace window. */
  finalizeAs?: SessionEndReason;
};

async function finalizeSession(
  io: Server,
  input: {
    roomId: string;
    reason?: SessionEndReason;
    elapsedSeconds?: number;
    solverId?: string;
    doubtId?: string;
  }
) {
  const parsed = parseSessionRoomId(input.roomId);
  if (!parsed) return;

  if (finalizingRooms.has(input.roomId)) return;
  finalizingRooms.set(input.roomId, true);

  try {
    const roomDoc = await Room.findOne({ roomId: input.roomId }).select("status").lean();
    if (!roomDoc || (roomDoc as { status?: string }).status !== "active") {
      return;
    }

    const doubtId = input.doubtId ?? parsed.doubtId;
    const solverId = input.solverId ?? parsed.solverId;
    const reason = input.reason ?? "solver_left";
    const elapsed = Math.max(0, input.elapsedSeconds ?? 0);

    const base = config.nextApiUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.publishApiKey) {
      headers["x-socket-api-key"] = config.publishApiKey;
    }

    let endResult: { ok: true; data: unknown } | { ok: false; data?: unknown; error?: unknown };
    try {
      const res = await fetch(`${base}/api/sessions/process-end`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          roomId: input.roomId,
          reason,
          elapsedSeconds: elapsed,
          solverId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok) {
        console.error("[room] process-end failed:", res.status, data);
        endResult = { ok: false, data };
      } else {
        endResult = { ok: true, data };
      }
    } catch (error) {
      console.error("[room] process-end request error:", error);
      endResult = { ok: false, error };
    }

    const processedPayload =
      endResult.ok && endResult.data && typeof endResult.data === "object"
        ? (endResult.data as { data?: Record<string, unknown> }).data ?? endResult.data
        : {};

    if (reason === "solver_left") {
      const payload = processedPayload as { askerMessage?: string };
      const askerMessage =
        typeof payload.askerMessage === "string"
          ? payload.askerMessage
          : "Your solver has left the session.";
      io.to(input.roomId).emit(SOCKET_EVENTS.SESSION_SOLVER_LEFT, {
        roomId: input.roomId,
        doubtId,
        reason,
        message: askerMessage,
        ...processedPayload,
      });
    }
    
    io.to(input.roomId).emit(SOCKET_EVENTS.SESSION_PROCESSED, {
      roomId: input.roomId,
      reason,
      elapsedSeconds: elapsed,
      ...processedPayload,
    });
  } finally {
    finalizingRooms.delete(input.roomId);
  }
}

export const registerRoomSocketHandlers = (socket: Socket, io: Server) => {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload: JoinRoomPayload | string = {}) => {
    const roomId =
      typeof payload === "string"
        ? payload.trim() || undefined
        : payload?.roomId?.trim() || undefined;

    if (!roomId) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "roomId is required to join room" });
      return;
    }

    const parsed = parseSessionRoomId(roomId);
    if (!parsed) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        message: "Invalid session room id. Use the full link from your dashboard.",
      });
      return;
    }

    const room = await Room.findOne({ roomId }).select(
      "hasSolverEverJoined hasAskerEverJoined solver_id doubter_id roomId sessionStartedAt maxSessionSeconds"
    );

    if (!room) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Room not found" });
      return;
    }

    const userId = String(socket.user.userId);
    const isSolver = userId === String(room.solver_id);
    const isAsker = userId === String(room.doubter_id);

    if (!isSolver && !isAsker) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        message: "You are not a participant in this session room",
      });
      return;
    }

    const waitingSocketIds = socket.nsp.adapter.rooms.get(roomId);
    const hasWaitingParticipant = Boolean(waitingSocketIds && waitingSocketIds.size > 0);

    socket.join(roomId);
    socket.data.sessionRoomId = roomId;

    const joinUpdate = isSolver ? { hasSolverEverJoined: true } : { hasAskerEverJoined: true };
    const updated = await Room.findOneAndUpdate({ roomId }, { $set: joinUpdate }, { new: true });

    if (!updated) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to update room join state" });
      return;
    }

    const doubt = await Doubt.findById(parsed.doubtId).select("category").lean();
    const doubtCategory = (doubt as { category?: string } | null)?.category;
    let maxSessionSeconds = resolveMaxSessionSeconds(
      Number(room.maxSessionSeconds) || null,
      doubtCategory
    );
    const storedMax = Number(room.maxSessionSeconds);
    if (storedMax !== maxSessionSeconds) {
      await Room.updateOne({ roomId }, { $set: { maxSessionSeconds } });
    }

    socket.emit(SOCKET_EVENTS.ROOM_JOINED_CONFIRMATION, { roomId, maxSessionSeconds });

    const bothBefore = Boolean(room.hasSolverEverJoined && room.hasAskerEverJoined);
    const bothNow = Boolean(updated.hasSolverEverJoined && updated.hasAskerEverJoined);
    const sessionAnchor = updated.sessionStartedAt ?? room.sessionStartedAt;

    if (bothNow && !bothBefore) {
      const startedAt = Date.now();
      await Room.findOneAndUpdate({ roomId }, { $set: { sessionStartedAt: new Date(startedAt) } });
      io.to(roomId).emit(SOCKET_EVENTS.SESSION_TIMER_START, {
        roomId,
        startedAt,
        maxSessionSeconds,
      });
    } else if (sessionAnchor) {
      socket.emit(SOCKET_EVENTS.SESSION_TIMER_START, {
        roomId,
        startedAt: new Date(sessionAnchor).getTime(),
        maxSessionSeconds,
      });
    }

    if (isAsker && hasWaitingParticipant && sessionAnchor) {
      io.to(roomId).emit(SOCKET_EVENTS.SESSION_ASKER_REJOINED, { roomId });
    }

    if (hasWaitingParticipant) {
      socket.to(roomId).emit(SOCKET_EVENTS.OTHER_PERSON_JOINED, {
        roomId,
        joinedSocketId: socket.id,
        user: {
          userId: socket.user.userId,
          username: socket.user.username,
          email: socket.user.email,
        },
      });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ roomId, elapsedSeconds, finalizeAs }: LeaveRoomPayload = {}) => {
    if (!roomId) return;

    const match = roomId.trim().match(ROOM_ID_PATTERN);
    if (!match) return;

    const doubtId = match[1];
    const solverId = match[2];
    const userId = socket.user.userId;

    void (async () => {
      const roomDoc = await Room.findOne({ roomId, status: "active" }).select(
        "roomId doubt_id solver_id doubter_id"
      );
      if (!roomDoc) return;

      let role: "solver" | "asker" | null = null;
      if (userId === solverId || userId === String(roomDoc.solver_id ?? solverId)) {
        role = "solver";
      } else if (userId === String(roomDoc.doubter_id ?? "")) {
        role = "asker";
      }
      if (!role) return;

      if (role === "solver") {
        await finalizeSession(io, {
          roomId,
          doubtId,
          solverId,
          reason: finalizeAs,
          elapsedSeconds: elapsedSeconds !== undefined ? Number(elapsedSeconds) : 0,
        });
        return;
      }

      socket.leave(roomId);
      const askerId = String(roomDoc.doubter_id ?? userId);
      if (isUserStillInRoom(io, roomId, askerId)) return;

      io.to(roomId).emit(SOCKET_EVENTS.SESSION_ASKER_LEFT, {
        roomId,
        graceSeconds: 3 * 60,
        message:
          "Asker left. Please wait up to 3 minutes for them to rejoin. If you leave early, wallet credit may be forfeited.",
      });
    })();
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.sessionRoomId;
    const userId = socket.user.userId;
    if (!roomId) return;

    const match = roomId.trim().match(ROOM_ID_PATTERN);
    if (!match) return;

    const doubtId = match[1];
    const solverId = match[2];

    setTimeout(() => {
      if (io.sockets.sockets.has(socket.id)) return;

      void (async () => {
        const roomDoc = await Room.findOne({ roomId, status: "active" }).select(
          "roomId doubt_id solver_id doubter_id"
        );
        if (!roomDoc) return;

        let role: "solver" | "asker" | null = null;
        if (userId === solverId || userId === String(roomDoc.solver_id ?? solverId)) {
          role = "solver";
        } else if (userId === String(roomDoc.doubter_id ?? "")) {
          role = "asker";
        }
        if (!role) return;

        if (role === "solver") {
          await finalizeSession(io, { roomId, doubtId, solverId, elapsedSeconds: 0 });
          return;
        }

        const askerId = String(roomDoc.doubter_id ?? userId);
        if (isUserStillInRoom(io, roomId, askerId)) return;

        io.to(roomId).emit(SOCKET_EVENTS.SESSION_ASKER_LEFT, {
          roomId,
          graceSeconds: 3 * 60,
          message:
            "Asker left. Please wait up to 3 minutes for them to rejoin. If you leave early, wallet credit may be forfeited.",
        });
      })();
    }, DISCONNECT_GRACE_MS);
  });
};
