import { Hono } from "hono";

/**
 * The game's HTTP API. Each route checks its input, asks src/game for the
 * answer, and returns JSON. The day's list entries never leave the server
 * before a player's round has ended.
 */
export function createApp(): Hono {
  const app = new Hono();
  app.get("/api/health", (context) => context.json({ ok: true }));
  return app;
}
