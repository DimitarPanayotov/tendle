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

async function setup(round?: { found: number[]; strikes: number }) {
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  if (round) await stores.rounds.saveRound({ playerId: ID, date: DATE, ...round });
  return { stores, app: createApp({ stores, now: () => NOW }) };
}

function post(
  app: ReturnType<typeof createApp>,
  body: unknown,
  headers: Record<string, string> = { "X-Player-Id": ID },
) {
  return app.request("/api/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/guess", () => {
  test("a right guess is found with its rank and answer, and the round is saved", async () => {
    const { app, stores } = await setup();
    const response = await post(app, { guess: "secret4" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      outcome: "found",
      entry: { rank: 4, answer: "Secret4" },
      found: [{ rank: 4, answer: "Secret4" }],
      strikesLeft: 3,
      over: false,
    });
    expect(await stores.rounds.getRound(ID, DATE)).toEqual({
      playerId: ID,
      date: DATE,
      found: [4],
      strikes: 0,
    });
  });

  test("an alias is found too, and the answers of other entries stay hidden", async () => {
    const { app } = await setup();
    const text = await (await post(app, { guess: "Hidden2" })).text();
    expect(text).toContain("Secret2");
    expect(text).not.toContain("Secret1");
    expect(text).not.toContain("Hidden");
  });

  test("a wrong guess is a strike and is saved", async () => {
    const { app, stores } = await setup({ found: [1], strikes: 0 });
    const body = await (await post(app, { guess: "nonsense" })).json();
    expect(body).toEqual({
      outcome: "strike",
      found: [{ rank: 1, answer: "Secret1" }],
      strikesLeft: 2,
      over: false,
    });
    expect((await stores.rounds.getRound(ID, DATE))?.strikes).toBe(1);
  });

  test("a guess already found changes nothing", async () => {
    const { app, stores } = await setup({ found: [1], strikes: 1 });
    const body = await (await post(app, { guess: "Secret1" })).json();
    expect(body.outcome).toBe("already-found");
    expect(body.strikesLeft).toBe(2);
    expect(body.over).toBe(false);
    expect(await stores.rounds.getRound(ID, DATE)).toEqual({
      playerId: ID,
      date: DATE,
      found: [1],
      strikes: 1,
    });
  });

  test("the third strike ends the round and reveals the list", async () => {
    const { app } = await setup({ found: [], strikes: 2 });
    const body = await (await post(app, { guess: "nonsense" })).json();
    expect(body.outcome).toBe("strike");
    expect(body.over).toBe(true);
    expect(body.strikesLeft).toBe(0);
    expect(body.entries).toEqual(list.entries.map(({ rank, answer }) => ({ rank, answer })));
    expect(JSON.stringify(body)).not.toContain("Hidden");
  });

  test("finding the tenth entry ends the round and reveals the list", async () => {
    const { app } = await setup({ found: [1, 2, 3, 4, 5, 6, 7, 8, 9], strikes: 0 });
    const body = await (await post(app, { guess: "Secret10" })).json();
    expect(body.outcome).toBe("found");
    expect(body.over).toBe(true);
    expect(body.entries).toHaveLength(10);
  });

  test("a guess after the round has ended is refused, not saved, and reveals the list", async () => {
    const { app, stores } = await setup({ found: [], strikes: 3 });
    const body = await (await post(app, { guess: "Secret1" })).json();
    expect(body.outcome).toBe("refused");
    expect(body.over).toBe(true);
    expect(body.found).toEqual([]);
    expect(body.entries).toHaveLength(10);
    expect(await stores.rounds.getRound(ID, DATE)).toEqual({
      playerId: ID,
      date: DATE,
      found: [],
      strikes: 3,
    });
  });

  test("rounds of different players are separate", async () => {
    const { app, stores } = await setup({ found: [], strikes: 3 });
    const other = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
    const body = await (await post(app, { guess: "Secret1" }, { "X-Player-Id": other })).json();
    expect(body.outcome).toBe("found");
    expect((await stores.rounds.getRound(other, DATE))?.found).toEqual([1]);
  });

  test("refuses a missing or bad player id", async () => {
    const { app } = await setup();
    expect((await post(app, { guess: "x" }, {})).status).toBe(400);
    expect((await post(app, { guess: "x" }, { "X-Player-Id": "nope" })).status).toBe(400);
  });

  test("refuses a body that is not JSON or has no usable guess", async () => {
    const { app, stores } = await setup();
    for (const body of ["not json", "null", {}, { guess: 5 }, { guess: "  " }, { guess: "a".repeat(201) }]) {
      expect((await post(app, body)).status).toBe(400);
    }
    expect(await stores.rounds.getRound(ID, DATE)).toBeUndefined();
  });

  test("is 404 before the game starts and when there is no list", async () => {
    const stores = createMemoryStores();
    const early = createApp({ stores, now: () => new Date("2020-01-01T00:00:00Z") });
    expect((await post(early, { guess: "x" })).status).toBe(404);
    const empty = createApp({ stores, now: () => NOW });
    expect((await post(empty, { guess: "x" })).status).toBe(404);
  });

  test("is not served without stores", async () => {
    expect((await post(createApp(), { guess: "x" })).status).toBe(404);
  });
});
