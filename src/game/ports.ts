import type { DailyList } from "./dailyList";

/** What is kept of one player's round; the list itself is stored once per date. */
export interface StoredRound {
  playerId: string;
  date: string;
  /** Ranks of the entries found, in the order they were found. */
  found: number[];
  strikes: number;
}

/** Final numbers of a settled day. */
export interface DayResults {
  date: string;
  players: number;
  /** For each rank found by anyone, how many players found it. */
  finderCounts: Record<number, number>;
  /** Each player's final score for the day, by player id. */
  scores: Record<string, number>;
}

export interface ListStore {
  saveList(list: DailyList): Promise<void>;
  /** The list for a date, or undefined when none is stored. */
  getList(date: string): Promise<DailyList | undefined>;
}

export interface RoundStore {
  /** Saves a round; a second save for the same player and date replaces the first. */
  saveRound(round: StoredRound): Promise<void>;
  getRound(playerId: string, date: string): Promise<StoredRound | undefined>;
  /** Every round of a date; empty when nobody played. */
  listRounds(date: string): Promise<StoredRound[]>;
  /** How many players found each rank on a date; ranks nobody found are left out. */
  finderCounts(date: string): Promise<Record<number, number>>;
  /** The dates of a player's finished rounds (MAX_STRIKES strikes or every entry found), oldest first. */
  finishedDates(playerId: string): Promise<string[]>;
}

export interface ResultStore {
  /** Saves a settled day; a second save for the same date replaces the first. */
  saveResults(results: DayResults): Promise<void>;
  /** The results of a settled day, or undefined when the day is not settled. */
  getResults(date: string): Promise<DayResults | undefined>;
}

export interface Stores {
  lists: ListStore;
  rounds: RoundStore;
  results: ResultStore;
}
