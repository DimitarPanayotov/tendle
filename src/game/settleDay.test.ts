import { describe, expect, it } from "vitest";
import type { DailyList } from "./dailyList";
import type { Round } from "./round";
import { ALL_FOUND_BONUS, entryScore } from "./scoring";
import { settleDay } from "./settleDay";

const names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet"];

const list: DailyList = {
  date: "2026-11-21",
  title: "Test list",
  sourceUrl: "https://example.com",
  entries: names.map((answer, i) => ({ rank: i + 1, answer, aliases: [] })),
};

const round = (found: number[]): Round => ({ list, found, strikes: 0 });

describe("settleDay", () => {
  it("counts finders per entry and scores every player", () => {
    const result = settleDay(list, [round([1, 2]), round([1]), round([])]);
    expect(result.counts.map((c) => c.foundBy)).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.counts[0]).toEqual({ rank: 1, foundBy: 2 });
    expect(result.scores).toEqual([entryScore(2, 3) + entryScore(1, 3), entryScore(2, 3), 0]);
  });

  it("adds the bonus to a player who found every entry", () => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = settleDay(list, [round(all)]);
    expect(result.scores).toEqual([10 * entryScore(1, 1) + ALL_FOUND_BONUS]);
  });

  it("counts a rank found twice once and ignores ranks outside the list", () => {
    const result = settleDay(list, [round([1, 1, 99])]);
    expect(result.counts[0]?.foundBy).toBe(1);
    expect(result.scores).toEqual([entryScore(1, 1)]);
  });

  it("gives empty results for a day with no players", () => {
    expect(settleDay(list, [])).toEqual({ counts: [], scores: [] });
  });
});
