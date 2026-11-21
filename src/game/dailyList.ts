import { normalize } from "./normalize";

export interface DailyListEntry {
  rank: number;
  answer: string;
  aliases: string[];
}

export interface DailyList {
  date: string;
  title: string;
  sourceUrl: string;
  entries: DailyListEntry[];
}

export type DailyListRule = "entry-count" | "duplicate-rank" | "duplicate-name";

export interface DailyListError {
  rule: DailyListRule;
  message: string;
}

export type DailyListResult = { ok: true } | { ok: false; errors: DailyListError[] };

export const ENTRIES_PER_LIST = 10;

/** Checks a day's list; every broken rule is reported with its own message. */
export function validateDailyList(list: DailyList): DailyListResult {
  const errors: DailyListError[] = [];
  const { entries } = list;

  if (entries.length !== ENTRIES_PER_LIST) {
    errors.push({
      rule: "entry-count",
      message: `A list needs exactly ${ENTRIES_PER_LIST} entries, but this one has ${entries.length}.`,
    });
  }

  const ranks = new Map<number, number>();
  entries.forEach((entry, index) => {
    const first = ranks.get(entry.rank);
    if (first === undefined) {
      ranks.set(entry.rank, index);
    } else {
      errors.push({
        rule: "duplicate-rank",
        message: `Rank ${entry.rank} is used twice: by entry ${first + 1} and entry ${index + 1}.`,
      });
    }
  });

  const names = new Map<string, string>();
  entries.forEach((entry, index) => {
    const where = `entry ${index + 1} (rank ${entry.rank})`;
    const candidates = [
      { text: entry.answer, label: `the answer of ${where}` },
      ...entry.aliases.map((alias) => ({ text: alias, label: `an other name of ${where}` })),
    ];
    for (const { text, label } of candidates) {
      const key = normalize(text);
      const seen = names.get(key);
      if (seen === undefined) {
        names.set(key, label);
      } else {
        errors.push({
          rule: "duplicate-name",
          message: `"${text}" reads the same as ${seen}; found in ${label}.`,
        });
      }
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
