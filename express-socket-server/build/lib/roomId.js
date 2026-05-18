"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSessionRoomId = parseSessionRoomId;
exports.maxSessionSecondsFromCategory = maxSessionSecondsFromCategory;
exports.resolveMaxSessionSeconds = resolveMaxSessionSeconds;
const ROOM_ID_PATTERN = /^doubt-([a-fA-F0-9]{24})-solver-([a-fA-F0-9]{24})$/;
function parseSessionRoomId(roomId) {
    if (!roomId)
        return null;
    const match = roomId.trim().match(ROOM_ID_PATTERN);
    if (!match)
        return null;
    return {
        roomId: roomId.trim(),
        doubtId: match[1],
        solverId: match[2],
    };
}
function maxSessionSecondsFromCategory(category) {
    const normalized = String(category || "medium").toLowerCase();
    if (normalized === "small")
        return 20 * 60;
    if (normalized === "large")
        return 60 * 60;
    return 30 * 60;
}
/** Doubt category is authoritative; stored room value is fallback only. */
function resolveMaxSessionSeconds(stored, doubtCategory) {
    if (doubtCategory) {
        return maxSessionSecondsFromCategory(doubtCategory);
    }
    const n = Number(stored);
    if (n > 0)
        return n;
    return maxSessionSecondsFromCategory("medium");
}
