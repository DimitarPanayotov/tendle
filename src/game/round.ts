import { type DailyList, ENTRIES_PER_LIST } from "./dailyList";
import { matchGuess, NO_MATCH } from "./matchGuess";

export const MAX_STRIKES = 3;

export interface Round {
  list: DailyList;
  /** Ranks of the entries found, in the order they were found. */
  found: number[];
  strikes: number;
}

export type GuessOutcome = "found" | "strike" | "already-found" | "refused";

export interface GuessResult {
  outcome: GuessOutcome;
  round: Round;
}

export function startRound(list: DailyList): Round {
  return { list, found: [], strikes: 0 };
}

export function isOver(round: Round): boolean {
  return round.strikes >= MAX_STRIKES || round.found.length >= ENTRIES_PER_LIST;
}

/** Applies a guess and returns the outcome with the new round; the given round is not changed. */
export function guess(round: Round, text: string): GuessResult {
  if (isOver(round)) return { outcome: "refused", round };

  const entry = matchGuess(text, round.list.entries);
  if (entry === NO_MATCH) {
    return { outcome: "strike", round: { ...round, strikes: round.strikes + 1 } };
  }
  if (round.found.includes(entry.rank)) return { outcome: "already-found", round };
  return { outcome: "found", round: { ...round, found: [...round.found, entry.rank] } };
}
