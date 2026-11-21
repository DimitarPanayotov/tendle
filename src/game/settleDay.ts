import type { DailyList } from "./dailyList";
import type { Round } from "./round";
import { dayScore } from "./scoring";

export interface EntryCount {
  rank: number;
  foundBy: number;
}

export interface DaySettlement {
  /** One count per entry of the list, in the list's order. */
  counts: EntryCount[];
  /** One final score per round, in the order the rounds were given. */
  scores: number[];
}

/**
 * Settles a day: counts how many players found each entry, then scores every
 * player with the rarity scoring. A rank found twice in one round counts once;
 * a rank that is not an entry of the list is ignored. No rounds give empty results.
 */
export function settleDay(list: DailyList, rounds: readonly Round[]): DaySettlement {
  if (rounds.length === 0) return { counts: [], scores: [] };

  const ranks = new Set(list.entries.map((entry) => entry.rank));
  const foundRanks = rounds.map((round) => new Set(round.found.filter((rank) => ranks.has(rank))));

  const counts = list.entries.map((entry) => ({
    rank: entry.rank,
    foundBy: foundRanks.filter((found) => found.has(entry.rank)).length,
  }));
  const countOf = new Map(counts.map((count) => [count.rank, count.foundBy]));

  const scores = foundRanks.map((found) =>
    dayScore(
      [...found].map((rank) => countOf.get(rank) ?? 0),
      rounds.length,
    ),
  );
  return { counts, scores };
}
