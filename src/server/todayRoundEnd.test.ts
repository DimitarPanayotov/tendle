import { describe, expect, test } from "vitest";
import type { DailyList } from "../game/dailyList";
import { createMemoryStores } from "../game/memoryStores";
import { createApp } from "./app";

const ME = "3b241101-e2bb-4255-8caf-4136c566a962";
const OTHER = "4c352212-f3cc-4366-9dbf-5247d677b073";
const NOW = new Date("2026-12-03T10:00:00Z");
const DATE = "2026-12-03";

const list: DailyList = {
  date: DATE,
  title: "Tallest mountains",
  sourceUrl: "https://example.com",
  entries: Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    answer: `Secret${index + 1}`,
    aliases: [],
  })),
};

async function today(mine: { found: number[]; strikes: number }) {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  await stores.rounds.saveRound({ playerId: ME, date: DATE, ...mine });
  await stores.rounds.saveRound({ playerId: OTHER, date: DATE, found: [1], strikes: 3 });
  const app = createApp({ stores, now: () => NOW });
  const response = await app.request("/api/today", { headers: { "X-Player-Id": ME } });
  return response.json();
}

describe("GET /api/today once the round is over", () => {
  test("three strikes: returns all ten entries, players, score and share text", async () => {
    const body = await today({ found: [1, 2], strikes: 3 });
    expect(body.entries).toHaveLength(10);
    expect(body.entries[0]).toEqual({ rank: 1, answer: "Secret1", finders: 2 });
    expect(body.entries[1]).toEqual({ rank: 2, answer: "Secret2", finders: 1 });
    expect(body.entries[9]).toEqual({ rank: 10, answer: "Secret10", finders: 0 });
    expect(body.players).toBe(2);
    expect(body.score).toBe(10 + 10 + 50);
    expect(body.shareText).toContain("Tendle #3 · 2/10");
    expect(body.shareText).toContain("tendle.pages.dev");
    expect(body.found).toEqual([
      { rank: 1, answer: "Secret1" },
      { rank: 2, answer: "Secret2" },
    ]);
  });

  test("all ten found: the round is over too", async () => {
    const body = await today({ found: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], strikes: 0 });
    expect(body.entries).toHaveLength(10);
    expect(body.shareText).toContain("10/10");
  });

  test("while the round is not over, none of it is returned", async () => {
    const body = await today({ found: [1], strikes: 2 });
    for (const key of ["entries", "players", "score", "shareText"]) expect(body).not.toHaveProperty(key);
    expect(JSON.stringify(body)).not.toContain("Secret5");
  });
});
