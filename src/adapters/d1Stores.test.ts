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
