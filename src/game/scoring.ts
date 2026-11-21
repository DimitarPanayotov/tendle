import { ENTRIES_PER_LIST } from "./dailyList";

export const BASE_POINTS = 10;
export const RARITY_POINTS = 100;
export const ALL_FOUND_BONUS = 100;

function isCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Points for one found entry: the base points plus rarity points that grow as
 * fewer of the day's players found it. With no players counted yet, the entry
 * counts as found by everyone. Counts that cannot happen (negative, fractional,
 * NaN, or more finders than players) throw a RangeError.
 */
export function entryScore(foundBy: number, players: number): number {
  if (!isCount(foundBy) || !isCount(players)) {
    throw new RangeError(`Counts must be whole numbers from 0 up, got foundBy ${foundBy} and players ${players}.`);
  }
  if (foundBy > players) {
    throw new RangeError(`${foundBy} players found an entry, but only ${players} players are counted.`);
  }
  const share = players === 0 ? 1 : foundBy / players;
  return BASE_POINTS + Math.round(RARITY_POINTS * (1 - share));
}

/**
 * A player's score for the day. `foundBy` holds, for each entry the player
 * found, how many of the day's `players` found that same entry. More found
 * entries than a list holds throws a RangeError.
 */
export function dayScore(foundBy: readonly number[], players: number): number {
  if (foundBy.length > ENTRIES_PER_LIST) {
    throw new RangeError(`A list has ${ENTRIES_PER_LIST} entries, but ${foundBy.length} were found.`);
  }
  const total = foundBy.reduce((sum, count) => sum + entryScore(count, players), 0);
  return foundBy.length === ENTRIES_PER_LIST ? total + ALL_FOUND_BONUS : total;
}
