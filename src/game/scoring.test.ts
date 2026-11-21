import { describe, expect, test } from "vitest";
import { ALL_FOUND_BONUS, BASE_POINTS, dayScore, entryScore } from "./scoring";

describe("entryScore", () => {
  test("an entry found by a quarter of the players scores 85", () => {
    expect(entryScore(25, 100)).toBe(BASE_POINTS + 75);
  });

  test("a rare entry scores up to 110 and a common one 10", () => {
    expect(entryScore(0, 100)).toBe(110);
    expect(entryScore(100, 100)).toBe(10);
  });

  test("with no players counted yet, an entry scores 10", () => {
    expect(entryScore(0, 0)).toBe(10);
    expect(dayScore([0, 0], 0)).toBe(20);
  });
});

describe("dayScore", () => {
  test("adds up the found entries", () => {
    expect(dayScore([25, 100], 100)).toBe(85 + 10);
  });

  test("finding all ten adds the bonus", () => {
    const all = Array<number>(10).fill(100);
    expect(dayScore(all, 100)).toBe(10 * 10 + ALL_FOUND_BONUS);
    expect(dayScore(all.slice(1), 100)).toBe(9 * 10);
  });
});

describe("bad input", () => {
  test("entryScore refuses more finders than players", () => {
    expect(() => entryScore(5, 4)).toThrow(RangeError);
  });

  test("entryScore refuses negative, fractional and NaN counts", () => {
    expect(() => entryScore(-1, 10)).toThrow(RangeError);
    expect(() => entryScore(1.5, 10)).toThrow(RangeError);
    expect(() => entryScore(Number.NaN, 10)).toThrow(RangeError);
    expect(() => entryScore(1, Number.NaN)).toThrow(RangeError);
    expect(() => entryScore(0, -1)).toThrow(RangeError);
  });

  test("dayScore refuses more found entries than a list holds", () => {
    expect(() => dayScore(Array<number>(11).fill(1), 1)).toThrow(RangeError);
  });

  test("dayScore passes on a bad count from one entry", () => {
    expect(() => dayScore([2], 1)).toThrow(RangeError);
  });
});
