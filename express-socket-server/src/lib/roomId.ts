const ROOM_ID_PATTERN = /^doubt-([a-fA-F0-9]{24})-solver-([a-fA-F0-9]{24})$/;

export type ParsedSessionRoom = {
  roomId: string;
  doubtId: string;
  solverId: string;
};

export function parseSessionRoomId(roomId: string | undefined | null): ParsedSessionRoom | null {
  if (!roomId) return null;
  const match = roomId.trim().match(ROOM_ID_PATTERN);
  if (!match) return null;
  return {
    roomId: roomId.trim(),
    doubtId: match[1],
    solverId: match[2],
  };
}

export function maxSessionSecondsFromCategory(category: string | undefined | null) {
  const normalized = String(category || "medium").toLowerCase();
  if (normalized === "small") return 20 * 60;
  if (normalized === "large") return 60 * 60;
  return 30 * 60;
}

/** Doubt category is authoritative; stored room value is fallback only. */
export function resolveMaxSessionSeconds(
  stored: number | null | undefined,
  doubtCategory: string | undefined | null
) {
  if (doubtCategory) {
    return maxSessionSecondsFromCategory(doubtCategory);
  }
  const n = Number(stored);
  if (n > 0) return n;
  return maxSessionSecondsFromCategory("medium");
}
