import { Hono } from "hono";
import { ENTRIES_PER_LIST } from "../game/dailyList";
import { gameDay } from "../game/gameDay";
import type { Stores } from "../game/ports";
import { MAX_STRIKES } from "../game/round";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

/** Builds the GET /api/today route. Only entries the player has found carry their answer. */
export function todayRoute(stores: Stores, now: () => Date): Hono<PlayerIdEnv> {
  const route = new Hono<PlayerIdEnv>();
  route.use("*", requirePlayerId);
  route.get("/", async (context) => {
    const { date, gameNumber } = gameDay(now());
    if (gameNumber === null) {
      return context.json({ error: "The game has not started yet" }, 404);
    }
    const list = await stores.lists.getList(date);
    if (list === undefined) {
      return context.json({ error: "There is no list for today" }, 404);
    }
    const round = await stores.rounds.getRound(context.get("playerId"), date);
    const foundRanks = round?.found ?? [];
    const found = foundRanks.flatMap((rank) => {
      const entry = list.entries.find((candidate) => candidate.rank === rank);
      return entry ? [{ rank: entry.rank, answer: entry.answer }] : [];
    });
    return context.json({
      gameNumber,
      title: list.title,
      slots: Array.from({ length: ENTRIES_PER_LIST }, (_, index) => ({ rank: index + 1 })),
      found,
      strikesLeft: Math.max(0, MAX_STRIKES - (round?.strikes ?? 0)),
    });
  });
  return route;
}
