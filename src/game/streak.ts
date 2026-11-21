const DAY_MS = 86_400_000;

function toDay(date: string, what: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`streak needs ${what} as a real YYYY-MM-DD date`);
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`streak needs ${what} as a real YYYY-MM-DD date`);
  }
  return Math.floor(ms / DAY_MS);
}

/**
 * Number of consecutive days (UTC, YYYY-MM-DD) with a finished round,
 * ending today or yesterday. Returns 0 when the run has already broken.
 * Throws RangeError on any date that is not a real YYYY-MM-DD.
 */
export function streak(finishedDates: readonly string[], today: string): number {
  const days = new Set<number>();
  const t = toDay(today, "today");
  for (const d of finishedDates) days.add(toDay(d, "each finished date"));
  let cursor = days.has(t) ? t : t - 1;
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor--;
  }
  return count;
}
