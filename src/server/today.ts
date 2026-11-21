import { Hono } from "hono";
import { type DailyList, ENTRIES_PER_LIST } from "../game/dailyList";
import { gameDay } from "../game/gameDay";
import type { Stores } from "../game/ports";
import { isOver, MAX_STRIKES } from "../game/round";
import { dayScore } from "../game/scoring";
import { buildShareText } from "../game/shareText";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

/** Once a round is over: every entry with its finders so far, the players so far, the score and the share text. */
async function describeEnd(
  stores: Stores,
  date: string,
  gameNumber: number,
  entries: DailyList["entries"],
  foundRanks: number[],
) {
  const counts = await stores.rounds.finderCounts(date);
  const players = Math.max(1, (await stores.rounds.listRounds(date)).length);
  const finders = (rank: number) => Math.min(counts[rank] ?? 0, players);
  const score = dayScore(
    foundRanks.map((rank) => finders(rank)),
    players,
  );
  const shareText = buildShareText({
    gameNumber,
    found: foundRanks.map((rank) => ({ rank, finders: finders(rank) })),
    players,
    score,
  });
  return {
    entries: [...entries]
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => ({ rank: entry.rank, answer: entry.answer, finders: finders(entry.rank) })),
    players,
    score,
    shareText,
  };
}

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
    const over = round !== undefined && isOver({ list, found: round.found, strikes: round.strikes });
    const ending = over ? await describeEnd(stores, date, gameNumber, list.entries, foundRanks) : {};
    return context.json({
      gameNumber,
      title: list.title,
      slots: Array.from({ length: ENTRIES_PER_LIST }, (_, index) => ({ rank: index + 1 })),
      found,
      strikesLeft: Math.max(0, MAX_STRIKES - (round?.strikes ?? 0)),
      ...ending,
    });
  });
  return route;
}
