import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { D1Database, D1PreparedStatement } from "../adapters/d1Stores";
import { SHARE_LINK } from "../game/shareText";
import worker, { type WorkerContext, type WorkerEnv } from "./worker";

const ID = "3b241101-e2bb-4255-8caf-4136c566a962";
const DATE = "2026-12-03";

interface Fake {
  db: D1Database;
  batches: { sql: string; values: unknown[] }[][];
}

/** A small in-memory stand-in for D1: answers the reads the routes make for one day with a finished round. */
function fakeD1(): Fake {
  const batches: Fake["batches"] = [];
  const statement = (
    sql: string,
    values: unknown[] = [],
  ): D1PreparedStatement & { sql: string; values: unknown[] } => ({
    sql,
    values,
    bind: (...next) => statement(sql, next),
    run: async () => ({}),
    first: async <T>() => {
      if (sql.startsWith("SELECT title")) return { title: "Tallest mountains", source_url: "https://example.com" } as T;
      if (sql.startsWith("SELECT strikes")) return { strikes: 3 } as T;
      return null;
    },
    all: async <T>() => {
      if (sql.startsWith("SELECT rank, answer")) {
        const results = Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, answer: `A${i + 1}`, aliases: "[]" }));
        return { results: results as T[] };
      }
      if (sql.startsWith("SELECT player_id, strikes")) return { results: [{ player_id: ID, strikes: 3 }] as T[] };
      return { results: [] as T[] };
    },
  });
  const db: D1Database = {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      batches.push(
        statements.map((s) => ({
          sql: (s as ReturnType<typeof statement>).sql,
          values: (s as ReturnType<typeof statement>).values,
        })),
      );
      return [];
    },
  };
  return { db, batches };
}

const ctx = (): WorkerContext & { promises: Promise<unknown>[] } => {
  const promises: Promise<unknown>[] = [];
  return { promises, waitUntil: (p) => void promises.push(p) };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${DATE}T10:00:00Z`));
});
afterEach(() => vi.useRealTimers());

async function today(env: WorkerEnv) {
  const response = await worker.fetch(
    new Request("https://x.test/api/today", { headers: { "X-Player-Id": ID } }),
    env,
    ctx(),
  );
  return (await response.json()) as { gameNumber: number; shareText: string };
}

describe("worker fetch", () => {
  test("a request to /api/today reaches the API with the D1 stores", async () => {
    const body = await today({ DB: fakeD1().db });
    expect(body.gameNumber).toBe(3);
    expect(body.shareText.split("\n")[1]).toBe(SHARE_LINK);
  });

  test("the share link is PUBLIC_URL when it is set", async () => {
    const body = await today({ DB: fakeD1().db, PUBLIC_URL: "https://tendle.example.com" });
    expect(body.shareText.split("\n")[1]).toBe("https://tendle.example.com");
  });

  test("an empty PUBLIC_URL falls back to the built-in link", async () => {
    const body = await today({ DB: fakeD1().db, PUBLIC_URL: "" });
    expect(body.shareText.split("\n")[1]).toBe(SHARE_LINK);
  });

  test("a request without a player id is refused", async () => {
    const response = await worker.fetch(new Request("https://x.test/api/today"), { DB: fakeD1().db }, ctx());
    expect(response.status).toBe(400);
  });
});

describe("worker scheduled", () => {
  test("settles the day before the scheduled time inside waitUntil", async () => {
    const { db, batches } = fakeD1();
    const context = ctx();
    await worker.scheduled({ scheduledTime: Date.parse("2026-12-04T00:05:00Z") }, { DB: db }, context);
    expect(context.promises).toHaveLength(1);
    await Promise.all(context.promises);
    const insert = batches.flat().find((s) => s.sql.startsWith("INSERT INTO day_results"));
    expect(insert?.values[0]).toBe(DATE);
    expect(insert?.values[1]).toBe(1);
  });
});
