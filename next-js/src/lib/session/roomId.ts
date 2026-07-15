const ROOM_ID_PATTERN = /^doubt-([a-fA-F0-9]{24})-solver-([a-fA-F0-9]{24})$/;

export type ParsedSessionRoom = {
  roomId: string;
  doubtId: string;
  solverId: string;
};

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export function buildSessionRoomId(doubtId: string, solverId: string) {
  return `doubt-${String(doubtId).trim()}-solver-${String(solverId).trim()}`;
}

export function isBareMongoObjectId(value: string | undefined | null) {
  if (!value) return false;
  return OBJECT_ID_PATTERN.test(value.trim());
}

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

export function plannedMinutesFromCategory(category: string | undefined | null) {
  const normalized = String(category || "medium").toLowerCase();
  if (normalized === "small") return 20;
  if (normalized === "large") return 60;
  return 30;
}

export function plannedSecondsFromCategory(category: string | undefined | null) {
  return plannedMinutesFromCategory(category) * 60;
}

/** Doubt category is authoritative; stored room value is fallback only. */
export function resolveMaxSessionSeconds(
  stored: number | null | undefined,
  doubtCategory: string | undefined | null
) {
  if (doubtCategory) {
    return plannedSecondsFromCategory(doubtCategory);
  }
  const n = Number(stored);
  if (n > 0) return n;
  return plannedSecondsFromCategory("medium");
}

export function categorySessionLabel(category: string | undefined | null) {
  const normalized = String(category || "medium").toLowerCase();
  if (normalized === "small") return "Quick · 20 min session";
  if (normalized === "large") return "Large · 60 min session";
  return "Medium · 30 min session";
}

export const ASKER_REJOIN_GRACE_SECONDS = 3 * 60;
