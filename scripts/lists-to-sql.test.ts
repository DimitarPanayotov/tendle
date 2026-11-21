import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listsToSql } from "./lists-to-sql";

function makeList(date: string) {
  return {
    date,
    title: "Made-up list",
    sourceUrl: "https://example.com/source",
    entries: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      answer: `Answer ${String.fromCharCode(65 + i)}`,
      aliases: i === 0 ? ["Alias 'A'"] : [],
    })),
  };
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lists-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function put(name: string, value: unknown) {
  writeFileSync(join(dir, name), typeof value === "string" ? value : JSON.stringify(value));
}

describe("listsToSql", () => {
  it("turns a good folder into plain INSERTs for lists and entries", () => {
    put("2026-11-22.json", makeList("2026-11-22"));
    put("2026-11-21.json", makeList("2026-11-21"));
    put("notes.txt", "ignored");
    mkdirSync(join(dir, "sub.json.d"));
    const sql = listsToSql(dir);
    const lines = sql.trim().split("\n");
    expect(lines).toHaveLength(22);
    expect(lines[0]).toBe(
      "INSERT INTO lists (date, title, source_url) VALUES ('2026-11-21', 'Made-up list', 'https://example.com/source');",
    );
    expect(lines[1]).toBe(
      `INSERT INTO entries (date, rank, answer, aliases) VALUES ('2026-11-21', 1, 'Answer A', '["Alias ''A''"]');`,
    );
    expect(lines[11]).toContain("VALUES ('2026-11-22', 'Made-up list'");
    expect(sql).not.toMatch(/REPLACE|BEGIN|COMMIT/);
  });

  it("stops on a bad list, naming the file and the rule", () => {
    put("2026-11-21.json", makeList("2026-11-21"));
    const bad = makeList("2026-11-22");
    bad.entries.pop();
    put("2026-11-22.json", bad);
    expect(() => listsToSql(dir)).toThrow(/2026-11-22\.json: entry-count/);
  });

  it("refuses a file whose name does not match its date", () => {
    put("2026-11-21.json", makeList("2026-11-23"));
    expect(() => listsToSql(dir)).toThrow(/2026-11-21\.json: file-name/);
  });

  it("refuses a file that is not a list", () => {
    put("2026-11-21.json", "{not json");
    expect(() => listsToSql(dir)).toThrow(/2026-11-21\.json: not valid JSON/);
    put("2026-11-21.json", { date: "2026-11-21" });
    expect(() => listsToSql(dir)).toThrow(/not a daily list/);
  });

  it("stops on an empty folder", () => {
    put("readme.txt", "no lists");
    expect(() => listsToSql(dir)).toThrow(/no \.json list files/);
  });

  it("runs through tsx, printing the SQL", () => {
    put("2026-11-21.json", makeList("2026-11-21"));
    const out = execFileSync("pnpm", ["exec", "tsx", "scripts/lists-to-sql.ts", dir], { encoding: "utf8" });
    expect(out).toBe(listsToSql(dir));
  });

  it("exits with an error and prints nothing for a bad folder", () => {
    const bad = makeList("2026-11-21");
    bad.entries.pop();
    put("2026-11-21.json", bad);
    const run = spawnSync("pnpm", ["exec", "tsx", "scripts/lists-to-sql.ts", dir], { encoding: "utf8" });
    expect(run.status).toBe(1);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("2026-11-21.json: entry-count");
  });
});
