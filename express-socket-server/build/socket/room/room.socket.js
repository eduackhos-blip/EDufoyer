"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoomSocketHandlers = void 0;
const config_1 = require("../../config");
const roomId_1 = require("../../lib/roomId");
const Doubt_1 = require("../../models/Doubt");
const Room_1 = require("../../models/Room");
const events_1 = require("../events");
const DISCONNECT_RECONNECT_GRACE_MS = 7000;
const ROOM_ID_PATTERN = /^doubt-([a-fA-F0-9]{24})-solver-([a-fA-F0-9]{24})$/;
/** roomId → true while this session is being finalized (blocks duplicate runs). */
const finalizingRooms = new Map();
function isUserStillInRoom(io, roomId, userId) {
    const memberIds = io.sockets.adapter.rooms.get(roomId);
    if (!memberIds)
        return false;
    for (const socketId of memberIds) {
        const peer = io.sockets.sockets.get(socketId);
        if (peer && String(peer.user.userId) === String(userId)) {
            return true;
        }
    }
    return false;
}
function isSessionFinalizeReason(value) {
    return (value === "solver_left" ||
        value === "asker_left_timeout" ||
        value === "asker_left_rated" ||
        value === "timer_completed" ||
        value === "solver_left_during_asker_grace");
}
async function finalizeSession(io, input) {
    const parsed = (0, roomId_1.parseSessionRoomId)(input.roomId);
    if (!parsed)
        return;
    if (finalizingRooms.has(input.roomId))
        return;
    finalizingRooms.set(input.roomId, true);
    try {
        const roomDoc = await Room_1.Room.findOne({ roomId: input.roomId }).select("status").lean();
        if (!roomDoc || roomDoc.status !== "active") {
            return;
        }
        const doubtId = input.doubtId ?? parsed.doubtId;
        const solverId = input.solverId ?? parsed.solverId;
        const reason = input.reason ?? "solver_left";
        const elapsed = Math.max(0, input.elapsedSeconds ?? 0);
        const base = config_1.config.nextApiUrl.replace(/\/+$/, "");
        const headers = {
            "Content-Type": "application/json",
        };
        if (config_1.config.publishApiKey) {
            headers["x-socket-api-key"] = config_1.config.publishApiKey;
        }
        let endResult;
        try {
            const res = await fetch(`${base}/api/sessions/process-end`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    roomId: input.roomId,
                    reason,
                    elapsedSeconds: elapsed,
                    solverId,
                    askerRating: input.askerRating,
                    askerComment: input.askerComment,
                }),
            });
            const data = (await res.json().catch(() => ({})));
            if (!res.ok) {
                console.error("[room] process-end failed:", res.status, data);
                endResult = { ok: false, data };
            }
            else {
                endResult = { ok: true, data };
            }
        }
        catch (error) {
            console.error("[room] process-end request error:", error);
            endResult = { ok: false, error };
        }
        const processedPayload = endResult.ok && endResult.data && typeof endResult.data === "object"
            ? endResult.data.data ?? endResult.data
            : {};
        if (reason === "solver_left") {
            const payload = processedPayload;
            const askerMessage = typeof payload.askerMessage === "string"
                ? payload.askerMessage
                : "Your solver has left the session.";
            io.to(input.roomId).emit(events_1.SOCKET_EVENTS.SESSION_SOLVER_LEFT, {
                roomId: input.roomId,
                doubtId,
                reason,
                message: askerMessage,
                ...processedPayload,
            });
        }
        io.to(input.roomId).emit(events_1.SOCKET_EVENTS.SESSION_PROCESSED, {
            roomId: input.roomId,
            reason,
            elapsedSeconds: elapsed,
            ...processedPayload,
        });
        if (reason === "timer_completed") {
            io.to(input.roomId).emit(events_1.SOCKET_EVENTS.SESSION_END_INTIMATION, {
                roomId: input.roomId,
                reason,
                message: "Your session has ended. You will be redirected to the dashboard in 5 seconds.",
                redirectSeconds: 5,
            });
        }
    }
    finally {
        finalizingRooms.delete(input.roomId);
    }
}
const registerRoomSocketHandlers = (socket, io) => {
    socket.on(events_1.SOCKET_EVENTS.JOIN_ROOM, async (payload = {}) => {
        const roomId = typeof payload === "string"
            ? payload.trim() || undefined
            : payload?.roomId?.trim() || undefined;
        if (!roomId) {
            socket.emit(events_1.SOCKET_EVENTS.ROOM_ERROR, { message: "roomId is required to join room" });
            return;
        }
        const parsed = (0, roomId_1.parseSessionRoomId)(roomId);
        if (!parsed) {
            socket.emit(events_1.SOCKET_EVENTS.ROOM_ERROR, {
                message: "Invalid session room id. Use the full link from your dashboard.",
            });
            return;
        }
        const room = await Room_1.Room.findOne({ roomId }).select("hasSolverEverJoined hasAskerEverJoined solver_id doubter_id roomId sessionStartedAt maxSessionSeconds");
        if (!room) {
            socket.emit(events_1.SOCKET_EVENTS.ROOM_ERROR, { message: "Room not found" });
            return;
        }
        const userId = String(socket.user.userId);
        const isSolver = userId === String(room.solver_id);
        const isAsker = userId === String(room.doubter_id);
        if (!isSolver && !isAsker) {
            socket.emit(events_1.SOCKET_EVENTS.ROOM_ERROR, {
                message: "You are not a participant in this session room",
            });
            return;
        }
        const waitingSocketIds = socket.nsp.adapter.rooms.get(roomId);
        const hasWaitingParticipant = Boolean(waitingSocketIds && waitingSocketIds.size > 0);
        socket.join(roomId);
        socket.data.sessionRoomId = roomId;
        const peersInRoom = socket.nsp.adapter.rooms.get(roomId);
        if (peersInRoom) {
            for (const peerSocketId of peersInRoom) {
                if (peerSocketId === socket.id)
                    continue;
                const peer = io.sockets.sockets.get(peerSocketId);
                if (!peer?.user)
                    continue;
                socket.emit(events_1.SOCKET_EVENTS.OTHER_PERSON_JOINED, {
                    roomId,
                    joinedSocketId: peerSocketId,
                    isExistingParticipant: true,
                    user: {
                        userId: peer.user.userId,
                        username: peer.user.username,
                        email: peer.user.email,
                    },
                });
            }
        }
        const joinUpdate = isSolver ? { hasSolverEverJoined: true } : { hasAskerEverJoined: true };
        const updated = await Room_1.Room.findOneAndUpdate({ roomId }, { $set: joinUpdate }, { new: true });
        if (!updated) {
            socket.emit(events_1.SOCKET_EVENTS.ROOM_ERROR, { message: "Failed to update room join state" });
            return;
        }
        const doubt = await Doubt_1.Doubt.findById(parsed.doubtId).select("category").lean();
        const doubtCategory = doubt?.category;
        let maxSessionSeconds = (0, roomId_1.resolveMaxSessionSeconds)(Number(room.maxSessionSeconds) || null, doubtCategory);
        const storedMax = Number(room.maxSessionSeconds);
        if (storedMax !== maxSessionSeconds) {
            await Room_1.Room.updateOne({ roomId }, { $set: { maxSessionSeconds } });
        }
        socket.emit(events_1.SOCKET_EVENTS.ROOM_JOINED_CONFIRMATION, { roomId, maxSessionSeconds });
        const bothBefore = Boolean(room.hasSolverEverJoined && room.hasAskerEverJoined);
        const bothNow = Boolean(updated.hasSolverEverJoined && updated.hasAskerEverJoined);
        const sessionAnchor = updated.sessionStartedAt ?? room.sessionStartedAt;
        if (bothNow && !bothBefore) {
            const startedAt = Date.now();
            await Room_1.Room.findOneAndUpdate({ roomId }, { $set: { sessionStartedAt: new Date(startedAt) } });
            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_TIMER_START, {
                roomId,
                startedAt,
                maxSessionSeconds,
            });
        }
        else if (sessionAnchor) {
            socket.emit(events_1.SOCKET_EVENTS.SESSION_TIMER_START, {
                roomId,
                startedAt: new Date(sessionAnchor).getTime(),
                maxSessionSeconds,
            });
        }
        if (isAsker && hasWaitingParticipant && sessionAnchor) {
            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_ASKER_REJOINED, {
                roomId,
                message: "Asker has reconnected to the session.",
            });
        }
        if (isSolver && hasWaitingParticipant && sessionAnchor) {
            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_SOLVER_REJOINED, {
                roomId,
                message: "Solver has reconnected to the session.",
            });
        }
        if (hasWaitingParticipant) {
            socket.to(roomId).emit(events_1.SOCKET_EVENTS.OTHER_PERSON_JOINED, {
                roomId,
                joinedSocketId: socket.id,
                isExistingParticipant: false,
                user: {
                    userId: socket.user.userId,
                    username: socket.user.username,
                    email: socket.user.email,
                },
            });
        }
    });
    socket.on(events_1.SOCKET_EVENTS.LEAVE_ROOM, ({ roomId, elapsedSeconds, finalizeAs, askerRatedOnLeave, askerRating, askerComment, } = {}) => {
        if (!roomId)
            return;
        const match = roomId.trim().match(ROOM_ID_PATTERN);
        if (!match)
            return;
        const doubtId = match[1];
        const solverId = match[2];
        const userId = socket.user.userId;
        void (async () => {
            const roomDoc = await Room_1.Room.findOne({ roomId, status: "active" }).select("roomId doubt_id solver_id doubter_id");
            if (!roomDoc)
                return;
            let role = null;
            if (userId === solverId || userId === String(roomDoc.solver_id ?? solverId)) {
                role = "solver";
            }
            else if (userId === String(roomDoc.doubter_id ?? "")) {
                role = "asker";
            }
            if (!role)
                return;
            const elapsed = elapsedSeconds !== undefined ? Number(elapsedSeconds) : 0;
            if (role === "solver") {
                await finalizeSession(io, {
                    roomId,
                    doubtId,
                    solverId,
                    reason: isSessionFinalizeReason(finalizeAs) ? finalizeAs : "solver_left",
                    elapsedSeconds: elapsed,
                });
                return;
            }
            if (finalizeAs === "timer_completed") {
                socket.leave(roomId);
                const askerId = String(roomDoc.doubter_id ?? userId);
                if (isUserStillInRoom(io, roomId, askerId))
                    return;
                await finalizeSession(io, {
                    roomId,
                    doubtId,
                    solverId,
                    reason: "timer_completed",
                    elapsedSeconds: elapsed,
                });
                return;
            }
            socket.leave(roomId);
            const askerId = String(roomDoc.doubter_id ?? userId);
            if (isUserStillInRoom(io, roomId, askerId))
                return;
            const rated = askerRatedOnLeave === true &&
                typeof askerRating === "number" &&
                askerRating >= 1 &&
                askerRating <= 5;
            if (rated) {
                await finalizeSession(io, {
                    roomId,
                    doubtId,
                    solverId,
                    reason: "asker_left_rated",
                    elapsedSeconds: elapsedSeconds !== undefined ? Number(elapsedSeconds) : 0,
                    askerRating: Math.round(askerRating),
                    askerComment: typeof askerComment === "string" ? askerComment : undefined,
                });
                return;
            }
            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_ASKER_LEFT, {
                roomId,
                graceSeconds: 3 * 60,
                message: "Asker left. Please wait up to 3 minutes for them to rejoin. If you leave early, wallet credit may be forfeited.",
            });
        })();
    });
    socket.on("disconnect", () => {
        const roomId = socket.data.sessionRoomId;
        const userId = socket.user.userId;
        if (!roomId)
            return;
        const match = roomId.trim().match(ROOM_ID_PATTERN);
        if (!match)
            return;
        const doubtId = match[1];
        const solverId = match[2];
        void (async () => {
            const roomDoc = await Room_1.Room.findOne({ roomId, status: "active" })
                .select("roomId doubt_id solver_id doubter_id")
                .lean();
            if (!roomDoc)
                return;
            let role = null;
            if (userId === solverId || userId === String(roomDoc.solver_id ?? solverId)) {
                role = "solver";
            }
            else if (userId === String(roomDoc.doubter_id ?? "")) {
                role = "asker";
            }
            if (!role)
                return;
            if (role === "asker") {
                io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_ASKER_DISCONNECTED, {
                    roomId,
                    reconnectGraceSeconds: Math.floor(DISCONNECT_RECONNECT_GRACE_MS / 1000),
                    message: "The asker may have reloaded the page or has a temporary connection issue. Please wait a few seconds.",
                });
                setTimeout(() => {
                    void (async () => {
                        const activeRoom = await Room_1.Room.findOne({ roomId, status: "active" })
                            .select("doubter_id")
                            .lean();
                        if (!activeRoom)
                            return;
                        const askerId = String(roomDoc.doubter_id ?? userId);
                        if (isUserStillInRoom(io, roomId, askerId)) {
                            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_ASKER_REJOINED, {
                                roomId,
                                message: "Asker has reconnected to the session.",
                            });
                            return;
                        }
                        io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_ASKER_LEFT, {
                            roomId,
                            graceSeconds: 3 * 60,
                            message: "Asker left. Please wait up to 3 minutes for them to rejoin. If you leave early, wallet credit may be forfeited.",
                        });
                    })();
                }, DISCONNECT_RECONNECT_GRACE_MS);
                return;
            }
            io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_SOLVER_DISCONNECTED, {
                roomId,
                reconnectGraceSeconds: Math.floor(DISCONNECT_RECONNECT_GRACE_MS / 1000),
                message: "Your solver may have reloaded the page or has a temporary connection issue. Please wait a few seconds.",
            });
            setTimeout(() => {
                void (async () => {
                    const activeRoom = await Room_1.Room.findOne({ roomId, status: "active" })
                        .select("solver_id")
                        .lean();
                    if (!activeRoom)
                        return;
                    const activeSolverId = String(activeRoom.solver_id ?? solverId);
                    if (isUserStillInRoom(io, roomId, activeSolverId)) {
                        io.to(roomId).emit(events_1.SOCKET_EVENTS.SESSION_SOLVER_REJOINED, {
                            roomId,
                            message: "Solver has reconnected to the session.",
                        });
                        return;
                    }
                    await finalizeSession(io, {
                        roomId,
                        doubtId,
                        solverId,
                        reason: "solver_left",
                        elapsedSeconds: 0,
                    });
                })();
            }, DISCONNECT_RECONNECT_GRACE_MS);
        })();
    });
};
exports.registerRoomSocketHandlers = registerRoomSocketHandlers;
