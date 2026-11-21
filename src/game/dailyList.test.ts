import { describe, expect, it } from "vitest";
import { type DailyList, type DailyListEntry, validateDailyList } from "./dailyList";

function makeList(): DailyList {
  return {
    date: "2026-11-21",
    title: "The 10 most populous countries",
    sourceUrl: "https://example.com/source",
    entries: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      answer: `Country ${String.fromCharCode(65 + i)}`,
      aliases: [`Alias ${String.fromCharCode(65 + i)}`],
    })),
  };
}

function at(list: DailyList, i: number): DailyListEntry {
  const entry = list.entries[i];
  if (!entry) throw new Error(`no entry ${i}`);
  return entry;
}

function rulesOf(list: DailyList): string[] {
  const result = validateDailyList(list);
  return result.ok ? [] : result.errors.map((e) => e.rule);
}

describe("validateDailyList", () => {
  it("passes a valid list", () => {
    expect(validateDailyList(makeList())).toEqual({ ok: true });
  });

  it("refuses a list with fewer than 10 entries", () => {
    const list = makeList();
    list.entries.pop();
    const result = validateDailyList(list);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.rule).toBe("entry-count");
      expect(result.errors[0]?.message).toContain("has 9");
    }
  });

  it("refuses a list with more than 10 entries", () => {
    const list = makeList();
    list.entries.push({ rank: 10, answer: "Extra", aliases: [] });
    expect(rulesOf(list)).toContain("entry-count");
  });

  it("refuses a rank above 10, so a list with no #10 fails", () => {
    const list = makeList();
    at(list, 9).rank = 11;
    const result = validateDailyList(list);
    expect(rulesOf(list)).toEqual(["rank-out-of-range"]);
    if (!result.ok) {
      expect(result.errors[0]?.message).toContain("Entry 10 has rank 11");
    }
  });

  it("refuses a rank of 0", () => {
    const list = makeList();
    at(list, 0).rank = 0;
    expect(rulesOf(list)).toEqual(["rank-out-of-range"]);
  });

  it("refuses a rank that is not a whole number", () => {
    const list = makeList();
    at(list, 3).rank = 4.5;
    expect(rulesOf(list)).toEqual(["rank-out-of-range"]);
  });

  it("refuses two entries sharing a rank, naming the rank and entries", () => {
    const list = makeList();
    at(list, 4).rank = 2;
    const result = validateDailyList(list);
    expect(rulesOf(list)).toEqual(["duplicate-rank"]);
    if (!result.ok) {
      expect(result.errors[0]?.message).toContain("Rank 2");
      expect(result.errors[0]?.message).toContain("entry 2 and entry 5");
    }
  });

  it("refuses two answers that read the same ignoring case, accents and punctuation", () => {
    const list = makeList();
    at(list, 0).answer = "Côte d'Ivoire";
    at(list, 6).answer = "COTE D IVOIRE!";
    const result = validateDailyList(list);
    expect(rulesOf(list)).toEqual(["duplicate-name"]);
    if (!result.ok) {
      expect(result.errors[0]?.message).toContain("entry 7");
      expect(result.errors[0]?.message).toContain("entry 1");
    }
  });

  it("refuses an other name that reads the same as another entry's answer", () => {
    const list = makeList();
    at(list, 2).aliases = ["country a"];
    expect(rulesOf(list)).toEqual(["duplicate-name"]);
  });

  it("refuses an other name repeated within the same entry", () => {
    const list = makeList();
    at(list, 1).aliases = ["USA", "usa!"];
    expect(rulesOf(list)).toEqual(["duplicate-name"]);
  });

  it("reports every broken rule with its own message", () => {
    const list = makeList();
    list.entries.pop();
    at(list, 1).rank = 1;
    at(list, 3).answer = "country a";
    expect(rulesOf(list)).toEqual(["entry-count", "duplicate-rank", "duplicate-name"]);
  });
});
