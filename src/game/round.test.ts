import { describe, expect, it } from "vitest";
import type { DailyList } from "./dailyList";
import { guess, isOver, MAX_STRIKES, startRound } from "./round";

const names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet"];

const list: DailyList = {
  date: "2026-11-21",
  title: "Test list",
  sourceUrl: "https://example.com",
  entries: names.map((answer, i) => ({ rank: i + 1, answer, aliases: [] })),
};

describe("round", () => {
  it("starts with nothing found and no strikes", () => {
    const round = startRound(list);
    expect(round.found).toEqual([]);
    expect(round.strikes).toBe(0);
    expect(isOver(round)).toBe(false);
  });

  it("a guess that matches an entry not yet found finds it", () => {
    const result = guess(startRound(list), "bravo");
    expect(result.outcome).toBe("found");
    expect(result.round.found).toEqual([2]);
    expect(result.round.strikes).toBe(0);
  });

  it("a guess that matches no entry is a strike", () => {
    const result = guess(startRound(list), "Zulu");
    expect(result.outcome).toBe("strike");
    expect(result.round.strikes).toBe(1);
    expect(result.round.found).toEqual([]);
  });

  it("a guess that matches an entry already found costs nothing and says so", () => {
    const first = guess(startRound(list), "Alpha");
    const again = guess(first.round, "alpha");
    expect(again.outcome).toBe("already-found");
    expect(again.round).toEqual(first.round);
  });

  it("does not change the round it was given", () => {
    const round = startRound(list);
    guess(round, "Alpha");
    guess(round, "Zulu");
    expect(round.found).toEqual([]);
    expect(round.strikes).toBe(0);
  });

  it("ends at the strike limit and refuses further guesses", () => {
    let round = startRound(list);
    for (let i = 0; i < MAX_STRIKES; i++) {
      expect(isOver(round)).toBe(false);
      round = guess(round, "Zulu").round;
    }
    expect(round.strikes).toBe(MAX_STRIKES);
    expect(isOver(round)).toBe(true);
    const after = guess(round, "Alpha");
    expect(after.outcome).toBe("refused");
    expect(after.round).toEqual(round);
  });

  it("ends when all ten entries are found and refuses further guesses", () => {
    let round = startRound(list);
    for (const name of names) {
      expect(isOver(round)).toBe(false);
      round = guess(round, name).round;
    }
    expect(round.found).toHaveLength(10);
    expect(isOver(round)).toBe(true);
    const after = guess(round, "Zulu");
    expect(after.outcome).toBe("refused");
    expect(after.round.strikes).toBe(0);
  });

  it("strikes do not end the round before the limit when entries are found between", () => {
    let round = startRound(list);
    round = guess(round, "Zulu").round;
    round = guess(round, "Alpha").round;
    round = guess(round, "Yankee").round;
    expect(isOver(round)).toBe(false);
  });
});
