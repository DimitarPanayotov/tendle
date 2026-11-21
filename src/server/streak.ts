import { Hono } from "hono";
import { gameDay } from "../game/gameDay";
import type { Stores } from "../game/ports";
import { streak } from "../game/streak";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

/** Builds the GET /api/streak route: the days in a row the player has finished a round. */
export function streakRoute(stores: Stores, now: () => Date): Hono<PlayerIdEnv> {
  const route = new Hono<PlayerIdEnv>();
  route.use("*", requirePlayerId);
  route.get("/", async (context) => {
    const finished = await stores.rounds.finishedDates(context.get("playerId"));
    return context.json({ streak: streak(finished, gameDay(now()).date) });
  });
  return route;
}
