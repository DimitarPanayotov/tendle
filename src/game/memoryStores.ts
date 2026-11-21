import { type DailyList, ENTRIES_PER_LIST } from "./dailyList";
import type { DayResults, ListStore, ResultStore, RoundStore, StoredRound, Stores } from "./ports";
import { MAX_STRIKES } from "./round";

// Copies keep callers from changing what is stored, as a real database would.
const copy = <T>(value: T): T => structuredClone(value);

export function createMemoryStores(): Stores {
  const lists = new Map<string, DailyList>();
  const rounds = new Map<string, Map<string, StoredRound>>();
  const results = new Map<string, DayResults>();

  const listStore: ListStore = {
    async saveList(list) {
      lists.set(list.date, copy(list));
    },
    async getList(date) {
      const list = lists.get(date);
      return list && copy(list);
    },
  };

  const roundsOf = (date: string): StoredRound[] => [...(rounds.get(date)?.values() ?? [])];

  const roundStore: RoundStore = {
    async saveRound(round) {
      const day = rounds.get(round.date) ?? new Map<string, StoredRound>();
      day.set(round.playerId, copy(round));
      rounds.set(round.date, day);
    },
    async getRound(playerId, date) {
      const round = rounds.get(date)?.get(playerId);
      return round && copy(round);
    },
    async listRounds(date) {
      return copy(roundsOf(date));
    },
    async finderCounts(date) {
      const counts: Record<number, number> = {};
      for (const round of roundsOf(date)) {
        for (const rank of new Set(round.found)) counts[rank] = (counts[rank] ?? 0) + 1;
      }
      return counts;
    },
    async finishedDates(playerId) {
      return [...rounds.entries()]
        .filter(([, day]) => {
          const round = day.get(playerId);
          return round !== undefined && (round.strikes >= MAX_STRIKES || new Set(round.found).size >= ENTRIES_PER_LIST);
        })
        .map(([date]) => date)
        .sort();
    },
  };

  const resultStore: ResultStore = {
    async saveResults(day) {
      results.set(day.date, copy(day));
    },
    async getResults(date) {
      const day = results.get(date);
      return day && copy(day);
    },
  };

  return { lists: listStore, rounds: roundStore, results: resultStore };
}
