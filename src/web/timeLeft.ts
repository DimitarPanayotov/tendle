const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** "5h 12m": the time from `now` until `target`, in whole hours and minutes; "0h 0m" once it has passed. */
export function timeLeft(target: string, now: Date): string {
  const ms = Date.parse(target) - now.getTime();
  const minutes = Number.isNaN(ms) ? 0 : Math.max(0, Math.floor(ms / MS_PER_MINUTE));
  return `${Math.floor(minutes / MINUTES_PER_HOUR)}h ${minutes % MINUTES_PER_HOUR}m`;
}
