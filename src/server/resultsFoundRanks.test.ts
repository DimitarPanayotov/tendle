import { describe, expect, test } from "vitest";
import type { DailyList } from "../game/dailyList";
import { createMemoryStores } from "../game/memoryStores";
import { createApp } from "./app";
import { settleYesterday } from "./settle";

const A = "3b241101-e2bb-4255-8caf-4136c566a962";
const B = "4c352212-f3cc-4366-9dbf-5247d77ab073";
const OUTSIDER = "5d463323-04dd-4477-8ecf-6358e88bc184";
const DATE = "2026-12-03";
const MIDNIGHT = new Date("2026-12-04T00:05:00Z");

const list: DailyList = {
  date: DATE,
  title: "Tallest mountains",
  sourceUrl: "https://example.com",
  entries: Array.from({ length: 10 }, (_, index) => ({ rank: index + 1, answer: `Secret${index + 1}`, aliases: [] })),
};

async function setup() {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  await stores.rounds.saveRound({ playerId: A, date: DATE, found: [2, 1], strikes: 3 });
  await stores.rounds.saveRound({ playerId: B, date: DATE, found: [], strikes: 3 });
  await settleYesterday(stores, MIDNIGHT);
  return createApp({ stores, now: () => MIDNIGHT });
}

async function body(id: string) {
  const app = await setup();
  const response = await app.request(`/api/results/${DATE}`, { headers: { "X-Player-Id": id } });
  expect(response.status).toBe(200);
  return response.json();
}

describe("GET /api/results/:date foundRanks", () => {
  test("lists the ranks a player found, in rank order", async () => {
    expect((await body(A)).foundRanks).toEqual([1, 2]);
  });

  test("is an empty list for a player who found none", async () => {
    const result = await body(B);
    expect(result.foundRanks).toEqual([]);
    expect(result.score).not.toBeNull();
  });

  test("is null, with a null score, for a player who did not play", async () => {
    const result = await body(OUTSIDER);
    expect(result.foundRanks).toBeNull();
    expect(result.score).toBeNull();
  });
});
