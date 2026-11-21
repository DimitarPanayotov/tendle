import { type DailyList, ENTRIES_PER_LIST } from "../game/dailyList";
import type { DayResults, StoredRound, Stores } from "../game/ports";
import { MAX_STRIKES } from "../game/round";

/** The part of a D1 statement the stores use. */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

/** The part of a D1 database the stores use. */
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  /** Runs the statements in order as one transaction: all or nothing. */
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

interface EntryRow {
  rank: number;
  answer: string;
  aliases: string;
}

interface FindRow {
  rank: number;
}

export function createD1Stores(db: D1Database): Stores {
  const run = (sql: string, ...values: unknown[]): D1PreparedStatement => db.prepare(sql).bind(...values);

  async function getRound(playerId: string, date: string): Promise<StoredRound | undefined> {
    const row = await run("SELECT strikes FROM rounds WHERE date = ? AND player_id = ?", date, playerId).first<{
      strikes: number;
    }>();
    if (!row) return undefined;
    const finds = await run(
      "SELECT rank FROM round_finds WHERE date = ? AND player_id = ? ORDER BY position",
      date,
      playerId,
    ).all<FindRow>();
    return { playerId, date, found: finds.results.map((f) => f.rank), strikes: row.strikes };
  }

  return {
    lists: {
      async saveList(list) {
        await db.batch([
          run("DELETE FROM entries WHERE date = ?", list.date),
          run("DELETE FROM lists WHERE date = ?", list.date),
          run("INSERT INTO lists (date, title, source_url) VALUES (?, ?, ?)", list.date, list.title, list.sourceUrl),
          ...list.entries.map((e) =>
            run(
              "INSERT INTO entries (date, rank, answer, aliases) VALUES (?, ?, ?, ?)",
              list.date,
              e.rank,
              e.answer,
              JSON.stringify(e.aliases),
            ),
          ),
        ]);
      },
      async getList(date): Promise<DailyList | undefined> {
        const row = await run("SELECT title, source_url FROM lists WHERE date = ?", date).first<{
          title: string;
          source_url: string;
        }>();
        if (!row) return undefined;
        const entries = await run(
          "SELECT rank, answer, aliases FROM entries WHERE date = ? ORDER BY rank",
          date,
        ).all<EntryRow>();
        return {
          date,
          title: row.title,
          sourceUrl: row.source_url,
          entries: entries.results.map((e) => ({
            rank: e.rank,
            answer: e.answer,
            aliases: JSON.parse(e.aliases) as string[],
          })),
        };
      },
    },
    rounds: {
      async saveRound(round) {
        await db.batch([
          run("DELETE FROM round_finds WHERE date = ? AND player_id = ?", round.date, round.playerId),
          run("DELETE FROM rounds WHERE date = ? AND player_id = ?", round.date, round.playerId),
          run(
            "INSERT INTO rounds (date, player_id, strikes) VALUES (?, ?, ?)",
            round.date,
            round.playerId,
            round.strikes,
          ),
          ...round.found.map((rank, i) =>
            run(
              "INSERT INTO round_finds (date, player_id, rank, position) VALUES (?, ?, ?, ?)",
              round.date,
              round.playerId,
              rank,
              i + 1,
            ),
          ),
        ]);
      },
      getRound,
      async listRounds(date) {
        const [roundRows, findRows] = await Promise.all([
          run("SELECT player_id, strikes FROM rounds WHERE date = ? ORDER BY player_id", date).all<{
            player_id: string;
            strikes: number;
          }>(),
          run("SELECT player_id, rank FROM round_finds WHERE date = ? ORDER BY player_id, position", date).all<{
            player_id: string;
            rank: number;
          }>(),
        ]);
        const foundBy = new Map<string, number[]>();
        for (const f of findRows.results) {
          const found = foundBy.get(f.player_id);
          if (found) found.push(f.rank);
          else foundBy.set(f.player_id, [f.rank]);
        }
        return roundRows.results.map((r) => ({
          playerId: r.player_id,
          date,
          found: foundBy.get(r.player_id) ?? [],
          strikes: r.strikes,
        }));
      },
      async finderCounts(date) {
        const rows = await run("SELECT rank, COUNT(*) AS n FROM round_finds WHERE date = ? GROUP BY rank", date).all<{
          rank: number;
          n: number;
        }>();
        const counts: Record<number, number> = {};
        for (const r of rows.results) counts[r.rank] = r.n;
        return counts;
      },
      async finishedDates(playerId) {
        const rows = await run(
          `SELECT r.date AS date FROM rounds r WHERE r.player_id = ? AND (r.strikes >= ?
             OR (SELECT COUNT(*) FROM round_finds f WHERE f.date = r.date AND f.player_id = r.player_id) >= ?)
           ORDER BY r.date`,
          playerId,
          MAX_STRIKES,
          ENTRIES_PER_LIST,
        ).all<{ date: string }>();
        return rows.results.map((r) => r.date);
      },
    },
    results: {
      async saveResults(results: DayResults) {
        await db.batch([
          run("DELETE FROM day_scores WHERE date = ?", results.date),
          run("DELETE FROM day_results WHERE date = ?", results.date),
          run(
            "INSERT INTO day_results (date, players, finder_counts) VALUES (?, ?, ?)",
            results.date,
            results.players,
            JSON.stringify(results.finderCounts),
          ),
          ...Object.entries(results.scores).map(([playerId, score]) =>
            run("INSERT INTO day_scores (date, player_id, score) VALUES (?, ?, ?)", results.date, playerId, score),
          ),
        ]);
      },
      async getResults(date) {
        const row = await run("SELECT players, finder_counts FROM day_results WHERE date = ?", date).first<{
          players: number;
          finder_counts: string;
        }>();
        if (!row) return undefined;
        const scoreRows = await run("SELECT player_id, score FROM day_scores WHERE date = ?", date).all<{
          player_id: string;
          score: number;
        }>();
        const scores: Record<string, number> = {};
        for (const s of scoreRows.results) scores[s.player_id] = s.score;
        return {
          date,
          players: row.players,
          finderCounts: JSON.parse(row.finder_counts) as Record<number, number>,
          scores,
        };
      },
    },
  };
}
