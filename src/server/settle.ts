import { gameDay } from "../game/gameDay";
import type { DayResults, Stores } from "../game/ports";
import { settleDay } from "../game/settleDay";

const MS_PER_DAY = 86_400_000;

export type SettleOutcome = "settled" | "already-settled" | "no-list";

/**
 * Settles yesterday (the UTC day before `now`) and saves the results through
 * the storage ports. Safe to run twice: a day that is already settled is left
 * as it is, and a day without a list has nothing to settle.
 */
export async function settleYesterday(stores: Stores, now: Date): Promise<{ date: string; outcome: SettleOutcome }> {
  const { date } = gameDay(now.getTime() - MS_PER_DAY);
  if ((await stores.results.getResults(date)) !== undefined) {
    return { date, outcome: "already-settled" };
  }
  const list = await stores.lists.getList(date);
  if (list === undefined) return { date, outcome: "no-list" };

  const stored = await stores.rounds.listRounds(date);
  const { counts, scores } = settleDay(
    list,
    stored.map((round) => ({ list, found: round.found, strikes: round.strikes })),
  );
  const results: DayResults = {
    date,
    players: stored.length,
    finderCounts: Object.fromEntries(
      counts.filter((count) => count.foundBy > 0).map((count) => [count.rank, count.foundBy]),
    ),
    scores: Object.fromEntries(stored.map((round, index) => [round.playerId, scores[index] ?? 0])),
  };
  await stores.results.saveResults(results);
  return { date, outcome: "settled" };
}
