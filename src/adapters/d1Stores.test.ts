import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { runStoreContract } from "../game/storeContract";
import { createD1Stores, type D1Database, type D1PreparedStatement } from "./d1Stores";

const MIGRATION = readFileSync(new URL("../../migrations/0001_initial.sql", import.meta.url), "utf8");

/** Fits node:sqlite to the small D1 shape the stores use. */
function wrap(db: DatabaseSync): D1Database {
  function statement(sql: string, values: SQLInputValue[]): D1PreparedStatement {
    return {
      bind: (...next) => statement(sql, next as SQLInputValue[]),
      run: async () => {
        db.prepare(sql).run(...values);
        return { results: [] };
      },
      first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
      all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
    };
  }
  return {
    prepare: (sql) => statement(sql, []),
    batch: async (statements) => {
      db.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        db.exec("COMMIT");
        return out;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function freshDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(MIGRATION);
  return db;
}

runStoreContract(() => createD1Stores(wrap(freshDb())), { describe, it, expect });

describe("d1 stores, all or nothing", () => {
  it("keeps the earlier round when a later save fails", async () => {
    const stores = createD1Stores(wrap(freshDb()));
    await stores.rounds.saveRound({ playerId: "p1", date: "2026-12-01", found: [1, 2], strikes: 1 });
    await expect(
      stores.rounds.saveRound({ playerId: "p1", date: "2026-12-01", found: [3, 3], strikes: 0 }),
    ).rejects.toThrow();
    expect(await stores.rounds.getRound("p1", "2026-12-01")).toEqual({
      playerId: "p1",
      date: "2026-12-01",
      found: [1, 2],
      strikes: 1,
    });
  });
});

describe("d1 stores, listing rounds", () => {
  it("reads a date's rounds with each round's finds in order, in two queries", async () => {
    const db = wrap(freshDb());
    const stores = createD1Stores(db);
    await stores.rounds.saveRound({ playerId: "p1", date: "2026-12-01", found: [2, 1], strikes: 1 });
    await stores.rounds.saveRound({ playerId: "p2", date: "2026-12-01", found: [], strikes: 3 });
    await stores.rounds.saveRound({ playerId: "p3", date: "2026-12-01", found: [5, 3, 4], strikes: 0 });
    await stores.rounds.saveRound({ playerId: "p4", date: "2026-12-02", found: [9], strikes: 2 });
    let queries = 0;
    const counting: D1Database = {
      batch: db.batch,
      prepare: (sql) => {
        queries += 1;
        return db.prepare(sql);
      },
    };
    const listed = await createD1Stores(counting).rounds.listRounds("2026-12-01");
    expect(listed).toEqual([
      { playerId: "p1", date: "2026-12-01", found: [2, 1], strikes: 1 },
      { playerId: "p2", date: "2026-12-01", found: [], strikes: 3 },
      { playerId: "p3", date: "2026-12-01", found: [5, 3, 4], strikes: 0 },
    ]);
    expect(queries).toBe(2);
  });
});
