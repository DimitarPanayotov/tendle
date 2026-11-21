import type { DailyList } from "./dailyList";
import type { DayResults, StoredRound, Stores } from "./ports";

const DATE = "2026-12-01";
const OTHER_DATE = "2026-12-02";

function list(date: string): DailyList {
  return {
    date,
    title: "Made-up list",
    sourceUrl: "https://example.com/list",
    entries: Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, answer: `Answer ${i + 1}`, aliases: [] })),
  };
}

function round(playerId: string, date: string, found: number[], strikes = 0): StoredRound {
  return { playerId, date, found, strikes };
}

interface Expectation {
  toEqual(expected: unknown): void;
  toBe(expected: unknown): void;
  toBeUndefined(): void;
  toHaveLength(length: number): void;
}

/** The test runner's functions, passed in because src/game imports no packages. */
export interface Harness {
  describe(name: string, body: () => void): void;
  it(name: string, body: () => Promise<void>): void;
  expect(actual: unknown): Expectation;
}

/** Tests every store must pass; give it a function that returns fresh, empty stores. */
export function runStoreContract(makeStores: () => Stores | Promise<Stores>, { describe, it, expect }: Harness): void {
  describe("list store", () => {
    it("returns the saved list for its date", async () => {
      const { lists } = await makeStores();
      await lists.saveList(list(DATE));
      expect(await lists.getList(DATE)).toEqual(list(DATE));
    });

    it("returns undefined for a date with no list", async () => {
      const { lists } = await makeStores();
      await lists.saveList(list(DATE));
      expect(await lists.getList(OTHER_DATE)).toBeUndefined();
    });

    it("does not let a caller change what is stored", async () => {
      const { lists } = await makeStores();
      const mine = list(DATE);
      await lists.saveList(mine);
      mine.entries = mine.entries.map((e) => ({ ...e, answer: "Changed" }));
      mine.entries[0]?.aliases.push("Changed");
      const got = await lists.getList(DATE);
      got?.entries[1]?.aliases.push("Changed");
      expect(await lists.getList(DATE)).toEqual(list(DATE));
    });

    it("replaces the list when a date is saved again", async () => {
      const { lists } = await makeStores();
      await lists.saveList(list(DATE));
      await lists.saveList({ ...list(DATE), title: "Second" });
      expect((await lists.getList(DATE))?.title).toBe("Second");
    });
  });

  describe("round store", () => {
    it("returns a player's round for a date, in the order found", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", DATE, [3, 1], 2));
      expect(await rounds.getRound("p1", DATE)).toEqual(round("p1", DATE, [3, 1], 2));
    });

    it("returns undefined for another player or another date", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", DATE, [1]));
      expect(await rounds.getRound("p2", DATE)).toBeUndefined();
      expect(await rounds.getRound("p1", OTHER_DATE)).toBeUndefined();
    });

    it("replaces a player's round when saved again", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", DATE, [1]));
      await rounds.saveRound(round("p1", DATE, [1, 2], 1));
      expect(await rounds.getRound("p1", DATE)).toEqual(round("p1", DATE, [1, 2], 1));
      expect(await rounds.listRounds(DATE)).toHaveLength(1);
    });

    it("lists only the rounds of the asked date", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", DATE, [1]));
      await rounds.saveRound(round("p2", DATE, [2]));
      await rounds.saveRound(round("p1", OTHER_DATE, [3]));
      const listed = await rounds.listRounds(DATE);
      expect(listed.map((r) => r.playerId).sort()).toEqual(["p1", "p2"]);
    });

    it("lists no rounds for a date nobody played", async () => {
      const { rounds } = await makeStores();
      expect(await rounds.listRounds(DATE)).toEqual([]);
    });

    it("counts the finders of each entry for the date, leaving out unfound ranks", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", DATE, [1, 2]));
      await rounds.saveRound(round("p2", DATE, [2, 3]));
      await rounds.saveRound(round("p3", DATE, [2]));
      await rounds.saveRound(round("p1", OTHER_DATE, [1, 2, 3]));
      expect(await rounds.finderCounts(DATE)).toEqual({ 1: 1, 2: 3, 3: 1 });
    });

    it("counts nothing for a date nobody played", async () => {
      const { rounds } = await makeStores();
      expect(await rounds.finderCounts(DATE)).toEqual({});
    });

    it("lists the dates of a player's finished rounds, oldest first", async () => {
      const { rounds } = await makeStores();
      await rounds.saveRound(round("p1", OTHER_DATE, [], 3));
      await rounds.saveRound(round("p1", DATE, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1));
      await rounds.saveRound(round("p1", "2026-12-03", [1, 2], 2));
      await rounds.saveRound(round("p2", "2026-12-04", [], 3));
      expect(await rounds.finishedDates("p1")).toEqual([DATE, OTHER_DATE]);
      expect(await rounds.finishedDates("nobody")).toEqual([]);
    });

    it("does not let a caller change what is stored", async () => {
      const { rounds } = await makeStores();
      const mine = round("p1", DATE, [1]);
      await rounds.saveRound(mine);
      mine.found.push(9);
      const got = await rounds.getRound("p1", DATE);
      got?.found.push(8);
      expect(await rounds.getRound("p1", DATE)).toEqual(round("p1", DATE, [1]));
    });
  });

  describe("result store", () => {
    const results: DayResults = {
      date: DATE,
      players: 4,
      finderCounts: { 1: 4, 2: 1 },
      scores: { p1: 150, p2: 90 },
    };

    it("returns the results of a settled day", async () => {
      const { results: store } = await makeStores();
      await store.saveResults(results);
      expect(await store.getResults(DATE)).toEqual(results);
    });

    it("does not let a caller change what is stored", async () => {
      const { results: store } = await makeStores();
      const mine: DayResults = { ...results, finderCounts: { 1: 4 }, scores: { p1: 150 } };
      await store.saveResults(mine);
      mine.scores.p1 = 0;
      mine.finderCounts[1] = 0;
      const got = await store.getResults(DATE);
      if (got) got.scores.p1 = 1;
      expect(await store.getResults(DATE)).toEqual({ ...results, finderCounts: { 1: 4 }, scores: { p1: 150 } });
    });

    it("returns undefined for a day that is not settled", async () => {
      const { results: store } = await makeStores();
      await store.saveResults(results);
      expect(await store.getResults(OTHER_DATE)).toBeUndefined();
    });

    it("replaces the results when a day is saved again", async () => {
      const { results: store } = await makeStores();
      await store.saveResults(results);
      await store.saveResults({ ...results, players: 5 });
      expect((await store.getResults(DATE))?.players).toBe(5);
    });
  });
}
