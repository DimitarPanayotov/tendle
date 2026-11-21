export const LAUNCH_DAY = "2026-12-01";

const MS_PER_DAY = 86_400_000;
const LAUNCH_DAY_MS = Date.parse(`${LAUNCH_DAY}T00:00:00Z`);

export type GameDay = {
  /** The UTC calendar date, YYYY-MM-DD. */
  date: string;
  /** 1 on launch day, counting up daily; null before launch. */
  gameNumber: number | null;
};

export function gameDay(moment: Date | number): GameDay {
  const ms = typeof moment === "number" ? moment : moment.getTime();
  const day = new Date(ms);
  if (Number.isNaN(day.getTime())) {
    throw new RangeError("gameDay needs a valid moment");
  }
  const date = day.toISOString().slice(0, 10);
  const startOfDay = Date.parse(`${date}T00:00:00Z`);
  const index = Math.round((startOfDay - LAUNCH_DAY_MS) / MS_PER_DAY);
  return { date, gameNumber: index >= 0 ? index + 1 : null };
}
