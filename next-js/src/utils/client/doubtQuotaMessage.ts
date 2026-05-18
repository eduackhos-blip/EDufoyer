export type DoubtQuotaDetails = {
  exhaustedCategory?: string;
  total?: number;
  limit?: number;
  categoryCounts?: Record<string, number>;
  limits?: Record<string, number>;
};

const CATEGORY_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const DEFAULT_LIMITS: Record<string, number> = { small: 2, medium: 2, large: 1 };

/** Daily quotas reset at local midnight (12:00 AM), same as the API. */
export function getNextQuotaResetDate(now = new Date()): Date {
  const reset = new Date(now);
  reset.setDate(reset.getDate() + 1);
  reset.setHours(0, 0, 0, 0);
  return reset;
}

export function getTimeUntilQuotaReset(now = new Date()) {
  const resetAt = getNextQuotaResetDate(now);
  const ms = Math.max(0, resetAt.getTime() - now.getTime());
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let durationLabel: string;
  if (hours <= 0 && minutes <= 1) {
    durationLabel = "less than a minute";
  } else if (hours === 0) {
    durationLabel = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  } else if (minutes === 0) {
    durationLabel = `${hours} hour${hours === 1 ? "" : "s"}`;
  } else {
    durationLabel = `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const resetTimeLabel = resetAt.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { resetAt, hours, minutes, durationLabel, resetTimeLabel };
}

export function buildQuotaLimitCopy(
  quotaDetails: DoubtQuotaDetails | null | undefined,
  attemptedCategory?: string
) {
  const { durationLabel, resetTimeLabel } = getTimeUntilQuotaReset();
  const limits = { ...DEFAULT_LIMITS, ...quotaDetails?.limits };
  const counts = quotaDetails?.categoryCounts ?? {};

  const isTotalLimit =
    quotaDetails?.limit === 5 &&
    typeof quotaDetails?.total === "number" &&
    quotaDetails.total >= 5;

  if (isTotalLimit) {
    const headline = "Daily doubt limit reached (5/5)";
    const detail =
      "You've used all 5 doubts for today — 2 Small, 2 Medium, and 1 Large.";
    const retry = `You can submit a new doubt in about ${durationLabel} (resets at 12:00 AM on ${resetTimeLabel}).`;
    return {
      headline,
      detail,
      retry,
      toast: `${headline}. ${detail} ${retry}`,
      popupBody: `${detail} ${retry}`,
    };
  }

  const exhausted =
    quotaDetails?.exhaustedCategory || attemptedCategory || "small";
  const label = CATEGORY_LABELS[exhausted] || exhausted;
  const limit = limits[exhausted] ?? DEFAULT_LIMITS[exhausted] ?? 0;
  const used = counts[exhausted] ?? limit;

  const headline = `${label} doubt limit reached (${used}/${limit} today)`;
  const detail = `You've used all ${limit} ${label} doubt slot${limit === 1 ? "" : "s"} for today.`;
  const otherHint =
    exhausted === "small" || exhausted === "medium"
      ? "You may still be able to ask Medium or Large doubts today."
      : exhausted === "large"
        ? "You may still be able to ask Small or Medium doubts today."
        : "";
  const retry = `You can ask a ${label} doubt again in about ${durationLabel} (resets at 12:00 AM on ${resetTimeLabel}).`;

  return {
    headline,
    detail,
    retry,
    toast: `${headline}. ${detail}${otherHint ? ` ${otherHint}` : ""} ${retry}`,
    popupBody: `${detail}${otherHint ? ` ${otherHint}` : ""} ${retry}`,
  };
}
