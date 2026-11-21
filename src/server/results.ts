import { Hono } from "hono";
import type { Stores } from "../game/ports";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Builds the GET /api/results/:date route. Only a settled day's list is ever returned. */
export function resultsRoute(stores: Stores): Hono<PlayerIdEnv> {
  const route = new Hono<PlayerIdEnv>();
  route.use("*", requirePlayerId);
  route.get("/:date", async (context) => {
    const date = context.req.param("date");
    if (!DATE.test(date)) {
      return context.json({ error: "The date must look like YYYY-MM-DD" }, 400);
    }
    const results = await stores.results.getResults(date);
    const list = results === undefined ? undefined : await stores.lists.getList(date);
    if (results === undefined || list === undefined) {
      return context.json({ error: "This day is not settled yet" }, 404);
    }
    return context.json({
      date,
      players: results.players,
      entries: list.entries.map((entry) => ({
        rank: entry.rank,
        answer: entry.answer,
        foundBy: results.finderCounts[entry.rank] ?? 0,
      })),
      score: results.scores[context.get("playerId")] ?? null,
    });
  });
  return route;
}
