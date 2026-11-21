import { describe, expect, test } from "vitest";
import { createMemoryStores } from "../game/memoryStores";
import { createApp } from "./app";

const ID = "3b241101-e2bb-4255-8caf-4136c566a962";
const NOW = new Date("2026-12-03T10:00:00Z");
const headers = { "X-Player-Id": ID };

async function streakWith(dates: string[], strikes = 3) {
  const stores = createMemoryStores();
  for (const date of dates) await stores.rounds.saveRound({ playerId: ID, date, found: [], strikes });
  const response = await createApp({ stores, now: () => NOW }).request("/api/streak", { headers });
  return { status: response.status, body: await response.json() };
}

describe("GET /api/streak", () => {
  test("is 0 for a player with no finished round", async () => {
    expect(await streakWith([])).toEqual({ status: 200, body: { streak: 0 } });
  });

  test("counts finished rounds on today and the days before", async () => {
    expect((await streakWith(["2026-12-03", "2026-12-02", "2026-12-01"])).body).toEqual({ streak: 3 });
  });

  test("is 0 when the last finished day is before yesterday", async () => {
    expect((await streakWith(["2026-12-01"])).body).toEqual({ streak: 0 });
  });

  test("ignores rounds that are not finished", async () => {
    expect((await streakWith(["2026-12-03"], 1)).body).toEqual({ streak: 0 });
  });

  test("refuses a request without a valid player id", async () => {
    const app = createApp({ stores: createMemoryStores(), now: () => NOW });
    expect((await app.request("/api/streak")).status).toBe(400);
  });
});
