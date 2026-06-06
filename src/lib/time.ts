// Helpers for "how long has it been in this stage" and the stuck flag.

import { STUCK_THRESHOLD_DAYS } from "./config";

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

// Human phrase like "2 days here", "5 hours here", "just now".
export function timeInStage(stageEnteredAt: string, now: number = Date.now()): string {
  const elapsed = now - new Date(stageEnteredAt).getTime();
  if (elapsed < 60 * MS_PER_MIN) {
    const mins = Math.max(0, Math.round(elapsed / MS_PER_MIN));
    if (mins < 1) return "just now";
    return `${mins} min here`;
  }
  if (elapsed < MS_PER_DAY) {
    const hours = Math.round(elapsed / MS_PER_HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} here`;
  }
  const days = Math.floor(elapsed / MS_PER_DAY);
  return `${days} ${days === 1 ? "day" : "days"} here`;
}

// True when the order has been in its stage longer than the threshold.
export function isStuck(stageEnteredAt: string, now: number = Date.now()): boolean {
  const elapsed = now - new Date(stageEnteredAt).getTime();
  return elapsed > STUCK_THRESHOLD_DAYS * MS_PER_DAY;
}

// Friendly absolute date+time, e.g. "7 Jun 2026, 2:14 pm".
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
