import { Hono } from "hono";
import type { DailyList } from "../game/dailyList";
import { gameDay } from "../game/gameDay";
import type { Stores } from "../game/ports";
import { guess, isOver, MAX_STRIKES, type Round, startRound } from "../game/round";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

const MAX_GUESS_LENGTH = 100;

/** The guess text of a request body, or undefined when the body has none that is usable. */
function guessText(body: unknown): string | undefined {
  const text = (body as { guess?: unknown } | null)?.guess;
  if (typeof text !== "string" || text.trim() === "" || text.length > MAX_GUESS_LENGTH) {
    return undefined;
  }
  return text;
}

const reveal = ({ rank, answer }: { rank: number; answer: string }) => ({ rank, answer });

/** What the player may see of the round: found entries, and the whole list once it is over. */
function describeRound(list: DailyList, round: Round) {
  const over = isOver(round);
  return {
    found: round.found.flatMap((rank) => {
      const entry = list.entries.find((candidate) => candidate.rank === rank);
      return entry ? [reveal(entry)] : [];
    }),
    strikesLeft: Math.max(0, MAX_STRIKES - round.strikes),
    over,
    ...(over ? { entries: list.entries.map(reveal) } : {}),
  };
}

/**
 * Builds the POST /api/guess route. The list's entries are returned only once
 * the player's round has ended; before that a found guess shows its own entry.
 */
export function guessRoute(stores: Stores, now: () => Date): Hono<PlayerIdEnv> {
  const route = new Hono<PlayerIdEnv>();
  route.use("*", requirePlayerId);
  route.post("/", async (context) => {
    const text = guessText(await context.req.json().catch(() => null));
    if (text === undefined) {
      return context.json({ error: `guess must be a text of 1 to ${MAX_GUESS_LENGTH} characters` }, 400);
    }

    const { date, gameNumber } = gameDay(now());
    if (gameNumber === null) {
      return context.json({ error: "The game has not started yet" }, 404);
    }
    const list = await stores.lists.getList(date);
    if (list === undefined) {
      return context.json({ error: "There is no list for today" }, 404);
    }

    const playerId = context.get("playerId");
    const stored = await stores.rounds.getRound(playerId, date);
    const before = stored ? { list, found: stored.found, strikes: stored.strikes } : startRound(list);
    const { outcome, round } = guess(before, text);
    if (outcome === "found" || outcome === "strike") {
      await stores.rounds.saveRound({ playerId, date, found: round.found, strikes: round.strikes });
    }

    const guessed =
      outcome === "found"
        ? list.entries.find((entry) => entry.rank === round.found[round.found.length - 1])
        : undefined;
    return context.json({
      outcome,
      ...(guessed ? { entry: reveal(guessed) } : {}),
      ...describeRound(list, round),
    });
  });
  return route;
}
