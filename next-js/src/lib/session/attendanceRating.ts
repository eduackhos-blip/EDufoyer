/** Map session attendance (0–100) to a 1–5 star auto-rating for the solver. */
export function attendancePercentToRating(attendancePercent: number) {
  const p = Math.max(0, Math.min(100, attendancePercent));
  if (p >= 90) return 5;
  if (p >= 75) return 4;
  if (p >= 60) return 3;
  if (p >= 40) return 2;
  return 1;
}

export function computeAttendancePercent(elapsedSeconds: number, plannedSeconds: number) {
  if (!plannedSeconds || plannedSeconds <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, elapsedSeconds) / plannedSeconds) * 100));
}
