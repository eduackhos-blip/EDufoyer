"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeSession = finalizeSession;
const config_1 = require("../config");
const roomId_1 = require("../lib/roomId");
const Room_1 = require("../models/Room");
const events_1 = require("../socket/events");
/** roomId → true while this session is being finalized (blocks duplicate runs). */
const finalizingRooms = new Map();
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
            console.warn("[session] finalize skipped — room missing or not active", input.roomId);
            return;
        }
        const doubtId = input.doubtId ?? parsed.doubtId;
        const solverId = input.solverId ?? parsed.solverId;
        const reason = input.reason ?? "solver_left";
        const elapsed = Math.max(0, input.elapsedSeconds ?? 0);
        console.log("[session] finalize", {
            roomId: input.roomId,
            doubtId,
            solverId,
            reason,
            elapsedSeconds: elapsed,
        });
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
                }),
            });
            const data = (await res.json().catch(() => ({})));
            if (!res.ok) {
                console.error("[session] process-end failed:", res.status, data);
                endResult = { ok: false, data };
            }
            else {
                endResult = { ok: true, data };
            }
        }
        catch (error) {
            console.error("[session] process-end request error:", error);
            endResult = { ok: false, error };
        }
        const processedPayload = endResult.ok && endResult.data && typeof endResult.data === "object"
            ? endResult.data.data ?? endResult.data
            : {};
        if (reason !== "asker_left_timeout") {
            io.to(input.roomId).emit(events_1.SESSION_SOCKET_EVENTS.SESSION_SOLVER_LEFT, {
                roomId: input.roomId,
                doubtId,
                reason,
                message: "Your solver has left the session. Please rate your experience.",
                ...processedPayload,
            });
        }
        io.to(input.roomId).emit(events_1.SESSION_SOCKET_EVENTS.SESSION_PROCESSED, {
            roomId: input.roomId,
            reason,
            elapsedSeconds: elapsed,
            ...processedPayload,
        });
    }
    finally {
        finalizingRooms.delete(input.roomId);
    }
}
