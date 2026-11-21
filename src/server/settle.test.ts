import { describe, expect, test } from "vitest";
import type { DailyList } from "../game/dailyList";
import { createMemoryStores } from "../game/memoryStores";
import { settleYesterday } from "./settle";

const A = "3b241101-e2bb-4255-8caf-4136c566a962";
const B = "4c352212-f3cc-4366-9dbf-5247d77ab073";
const DATE = "2026-12-03";
const NOW = new Date("2026-12-04T00:05:00Z");

const list: DailyList = {
  date: DATE,
  title: "Tallest mountains",
  sourceUrl: "https://example.com",
  entries: Array.from({ length: 10 }, (_, index) => ({ rank: index + 1, answer: `Secret${index + 1}`, aliases: [] })),
};

async function setup() {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  await stores.rounds.saveRound({ playerId: A, date: DATE, found: [1, 2], strikes: 3 });
  await stores.rounds.saveRound({ playerId: B, date: DATE, found: [1], strikes: 3 });
  return stores;
}

describe("settleYesterday", () => {
  test("settles the day before now and saves the results", async () => {
    const stores = await setup();
    expect(await settleYesterday(stores, NOW)).toEqual({ date: DATE, outcome: "settled" });
    const results = await stores.results.getResults(DATE);
    expect(results?.players).toBe(2);
    expect(results?.finderCounts).toEqual({ 1: 2, 2: 1 });
    expect(Object.keys(results?.scores ?? {}).sort()).toEqual([A, B].sort());
    expect(results?.scores[A]).toBeGreaterThan(results?.scores[B] ?? Infinity);
  });

  test("settling twice changes nothing", async () => {
    const stores = await setup();
    await settleYesterday(stores, NOW);
    const first = await stores.results.getResults(DATE);
    await stores.rounds.saveRound({ playerId: "late", date: DATE, found: [3], strikes: 0 });
    expect(await settleYesterday(stores, NOW)).toEqual({ date: DATE, outcome: "already-settled" });
    expect(await stores.results.getResults(DATE)).toEqual(first);
  });

  test("a day without a list settles nothing", async () => {
    const stores = createMemoryStores();
    expect(await settleYesterday(stores, NOW)).toEqual({ date: DATE, outcome: "no-list" });
    expect(await stores.results.getResults(DATE)).toBeUndefined();
  });

  test("a day nobody played settles with no players", async () => {
    const stores = createMemoryStores();
    await stores.lists.saveList(list);
    await settleYesterday(stores, NOW);
    expect(await stores.results.getResults(DATE)).toEqual({ date: DATE, players: 0, finderCounts: {}, scores: {} });
  });
});
