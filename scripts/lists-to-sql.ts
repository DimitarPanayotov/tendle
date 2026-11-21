/**
 * Turns a folder of daily list files (<date>.json) into the SQL that loads them.
 * Run it with tsx, which resolves the imports src/ uses:
 *   pnpm run lists-to-sql <folder> > lists.sql
 *   pnpm exec tsx scripts/lists-to-sql.ts <folder> > lists.sql
 * Then a person runs the SQL with `wrangler d1 execute --file`. It never touches a database or the network.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type DailyList, validateDailyList } from "../src/game/dailyList";

function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function isDailyList(value: unknown): value is DailyList {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    typeof v.title === "string" &&
    typeof v.sourceUrl === "string" &&
    Array.isArray(v.entries) &&
    v.entries.every((e) => {
      if (typeof e !== "object" || e === null) return false;
      const entry = e as Record<string, unknown>;
      return (
        typeof entry.rank === "number" &&
        typeof entry.answer === "string" &&
        Array.isArray(entry.aliases) &&
        entry.aliases.every((a) => typeof a === "string")
      );
    })
  );
}

function readList(folder: string, file: string): DailyList {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(join(folder, file), "utf8"));
  } catch (error) {
    throw new Error(`${file}: not valid JSON (${error instanceof Error ? error.message : error})`);
  }
  if (!isDailyList(parsed)) {
    throw new Error(`${file}: not a daily list (needs date, title, sourceUrl and entries with rank, answer, aliases)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    throw new Error(`${file}: date-format: "${parsed.date}" is not a YYYY-MM-DD date`);
  }
  if (file !== `${parsed.date}.json`) {
    throw new Error(`${file}: file-name: must be named ${parsed.date}.json to match its date`);
  }
  const result = validateDailyList(parsed);
  if (!result.ok) {
    const broken = result.errors.map((e) => `${e.rule}: ${e.message}`).join("; ");
    throw new Error(`${file}: ${broken}`);
  }
  return parsed;
}

/** Returns the SQL that inserts every list in the folder; throws, returning nothing, if any list is bad. */
export function listsToSql(folder: string): string {
  const files = readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new Error(`${folder}: no .json list files found`);

  const statements: string[] = [];
  for (const file of files) {
    const list = readList(folder, file);
    statements.push(
      `INSERT INTO lists (date, title, source_url) VALUES (${sqlText(list.date)}, ${sqlText(list.title)}, ${sqlText(list.sourceUrl)});`,
    );
    for (const entry of [...list.entries].sort((a, b) => a.rank - b.rank)) {
      statements.push(
        `INSERT INTO entries (date, rank, answer, aliases) VALUES (${sqlText(list.date)}, ${entry.rank}, ${sqlText(entry.answer)}, ${sqlText(JSON.stringify(entry.aliases))});`,
      );
    }
  }
  return `${statements.join("\n")}\n`;
}

function main(): void {
  const folder = process.argv[2];
  if (!folder) {
    process.stderr.write("usage: lists-to-sql.ts <folder>\n");
    process.exit(1);
  }
  try {
    process.stdout.write(listsToSql(folder));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
