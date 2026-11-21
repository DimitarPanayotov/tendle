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

async function setup(settle: boolean) {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  await stores.rounds.saveRound({ playerId: A, date: DATE, found: [1, 2], strikes: 3 });
  await stores.rounds.saveRound({ playerId: B, date: DATE, found: [1], strikes: 3 });
  if (settle) await settleYesterday(stores, MIDNIGHT);
  return { stores, app: createApp({ stores, now: () => MIDNIGHT }) };
}

const get = (app: ReturnType<typeof createApp>, id: string | undefined, date = DATE) =>
  app.request(`/api/results/${date}`, { headers: id ? { "X-Player-Id": id } : {} });

describe("GET /api/results/:date", () => {
  test("a settled day returns the entries with finder counts and the player's score", async () => {
    const { stores, app } = await setup(true);
    const response = await get(app, A);
    expect(response.status).toBe(200);
    const body = await response.json();
    const saved = await stores.results.getResults(DATE);
    expect(body.players).toBe(2);
    expect(body.entries).toHaveLength(10);
    expect(body.entries[0]).toEqual({ rank: 1, answer: "Secret1", foundBy: 2 });
    expect(body.entries[1]).toEqual({ rank: 2, answer: "Secret2", foundBy: 1 });
    expect(body.entries[2]).toEqual({ rank: 3, answer: "Secret3", foundBy: 0 });
    expect(body.score).toBe(saved?.scores[A]);
    expect(body.score).toBeGreaterThan(0);
  });

  test("a player with no round gets the results and a null score", async () => {
    const { app } = await setup(true);
    const response = await get(app, OUTSIDER);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.score).toBeNull();
    expect(body.players).toBe(2);
  });

  test("a day not settled yet is a 404 with a reason and no entries", async () => {
    const { app } = await setup(false);
    const response = await get(app, A);
    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toContain("not settled");
    expect(text).not.toContain("Secret");
  });

  test("needs the player id and a well-formed date", async () => {
    const { app } = await setup(true);
    expect((await get(app, undefined)).status).toBe(400);
    expect((await get(app, A, "yesterday")).status).toBe(400);
  });
});
