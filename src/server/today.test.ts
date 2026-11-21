import { describe, expect, test } from "vitest";
import type { DailyList } from "../game/dailyList";
import { createMemoryStores } from "../game/memoryStores";
import { createApp } from "./app";

const ID = "3b241101-e2bb-4255-8caf-4136c566a962";
const NOW = new Date("2026-12-03T10:00:00Z");
const DATE = "2026-12-03";

const list: DailyList = {
  date: DATE,
  title: "Tallest mountains",
  sourceUrl: "https://example.com",
  entries: Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    answer: `Secret${index + 1}`,
    aliases: [`Hidden${index + 1}`],
  })),
};

async function setup(found: number[] = [1, 3], strikes = 1) {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  await stores.rounds.saveRound({ playerId: ID, date: DATE, found, strikes });
  return createApp({ stores, now: () => NOW });
}

const headers = { "X-Player-Id": ID };

describe("GET /api/today", () => {
  test("never contains the answer or aliases of an unfound entry", async () => {
    const app = await setup();
    const response = await app.request("/api/today", { headers });
    expect(response.status).toBe(200);
    const text = await response.text();
    for (const rank of [2, 4, 5, 6, 7, 8, 9, 10]) {
      expect(text).not.toContain(`Secret${rank}`);
      expect(text).not.toContain(`Hidden${rank}`);
    }
    expect(text).not.toContain("Hidden1");
    expect(text).toContain("Secret1");
    expect(text).toContain("Secret3");
  });

  test("returns the game number, title, 10 slots, found entries and strikes left", async () => {
    const app = await setup();
    const body = await (await app.request("/api/today", { headers })).json();
    expect(body).toEqual({
      gameNumber: 3,
      title: "Tallest mountains",
      slots: Array.from({ length: 10 }, (_, index) => ({ rank: index + 1 })),
      found: [
        { rank: 1, answer: "Secret1" },
        { rank: 3, answer: "Secret3" },
      ],
      strikesLeft: 2,
    });
  });

  test("a player with no round yet sees nothing found and all strikes left", async () => {
    const stores = createMemoryStores();
    await stores.lists.saveList(list);
    const app = createApp({ stores, now: () => NOW });
    const body = await (await app.request("/api/today", { headers })).json();
    expect(body.found).toEqual([]);
    expect(body.strikesLeft).toBe(3);
  });

  test("answers 404 with a reason when there is no list for today", async () => {
    const app = createApp({ stores: createMemoryStores(), now: () => NOW });
    const response = await app.request("/api/today", { headers });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "There is no list for today" });
  });

  test("answers 404 before launch day", async () => {
    const stores = createMemoryStores();
    const app = createApp({ stores, now: () => new Date("2026-11-01T00:00:00Z") });
    const response = await app.request("/api/today", { headers });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "The game has not started yet" });
  });

  test("refuses a request without a valid player id", async () => {
    const app = await setup();
    expect((await app.request("/api/today")).status).toBe(400);
    expect((await app.request("/api/today", { headers: { "X-Player-Id": "nope" } })).status).toBe(400);
  });
});
