import type { DailyListEntry } from "./dailyList";
import { normalize } from "./normalize";

export const NO_MATCH = "no match";
export const MIN_TYPO_LENGTH = 5;

/** True when a and b differ by one letter added, missing, replaced, or swapped with its neighbour. */
function withinOneTypo(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  const restA = a.slice(i + 1);
  const restB = b.slice(i + 1);
  if (a.length === b.length) {
    if (restA === restB) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? restA === b.slice(i) : a.slice(i) === restB;
}

function names(entry: DailyListEntry): string[] {
  return [entry.answer, ...entry.aliases].map(normalize).filter((name) => name !== "");
}

/** Returns the entry the guess names, or "no match". */
export function matchGuess(guess: string, entries: DailyListEntry[]): DailyListEntry | typeof NO_MATCH {
  const key = normalize(guess);
  if (key === "") return NO_MATCH;

  for (const entry of entries) {
    if (names(entry).includes(key)) return entry;
  }

  if (/\d/.test(key)) return NO_MATCH;
  for (const entry of entries) {
    const close = names(entry).some(
      (name) => name.replace(/ /g, "").length >= MIN_TYPO_LENGTH && !/\d/.test(name) && withinOneTypo(key, name),
    );
    if (close) return entry;
  }
  return NO_MATCH;
}
