import { Hono } from "hono";
import type { Stores } from "../game/ports";
import { todayRoute } from "./today";

export interface AppOptions {
  /** Where lists and rounds are read from; without it the game routes are not served. */
  stores?: Stores;
  /** The clock; defaults to the real time. */
  now?: () => Date;
}

/**
 * The game's HTTP API. Each route checks its input, asks src/game for the
 * answer, and returns JSON. The day's list entries never leave the server
 * before a player's round has ended.
 */
export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();
  app.get("/api/health", (context) => context.json({ ok: true }));
  if (options.stores) {
    app.route("/api/today", todayRoute(options.stores, options.now ?? (() => new Date())));
  }
  return app;
}
