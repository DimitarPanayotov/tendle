export const BASE_POINTS = 10;
export const RARITY_POINTS = 100;
export const ALL_FOUND_BONUS = 100;
export const ENTRIES_PER_DAY = 10;

/**
 * Points for one found entry: the base points plus rarity points that grow as
 * fewer of the day's players found it. With no players counted yet, the entry
 * counts as found by everyone.
 */
export function entryScore(foundBy: number, players: number): number {
  const share = players > 0 ? Math.min(Math.max(foundBy / players, 0), 1) : 1;
  return BASE_POINTS + Math.round(RARITY_POINTS * (1 - share));
}

/**
 * A player's score for the day. `foundBy` holds, for each entry the player
 * found, how many of the day's `players` found that same entry.
 */
export function dayScore(foundBy: readonly number[], players: number): number {
  const total = foundBy.reduce((sum, count) => sum + entryScore(count, players), 0);
  return foundBy.length >= ENTRIES_PER_DAY ? total + ALL_FOUND_BONUS : total;
}
