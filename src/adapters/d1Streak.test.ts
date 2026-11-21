import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { createD1Stores, type D1Database, type D1PreparedStatement } from "./d1Stores";

const MIGRATION = readFileSync(new URL("../../migrations/0001_initial.sql", import.meta.url), "utf8");

function wrap(db: DatabaseSync): D1Database {
  const statement = (sql: string, values: never[]): D1PreparedStatement => ({
    bind: (...next) => statement(sql, next as never[]),
    run: async () => db.prepare(sql).run(...values),
    first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
    all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
  });
  return { prepare: (sql) => statement(sql, []), batch: async () => [] };
}

it("D1 finishedDates reads finished rounds from rounds and round_finds", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(MIGRATION);
  const stores = createD1Stores(wrap(db));
  await db.exec(
    "INSERT INTO rounds (date, player_id, strikes) VALUES ('2026-12-02','p1',3),('2026-12-01','p1',0),('2026-12-03','p1',1),('2026-12-04','p2',3)",
  );
  for (let rank = 1; rank <= 10; rank++) {
    db.exec(`INSERT INTO round_finds (date, player_id, rank, position) VALUES ('2026-12-01','p1',${rank},${rank})`);
  }
  expect(await stores.rounds.finishedDates("p1")).toEqual(["2026-12-01", "2026-12-02"]);
});
