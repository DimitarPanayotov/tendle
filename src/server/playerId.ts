import type { MiddlewareHandler } from "hono";

export type PlayerIdEnv = { Variables: { playerId: string } };

export const PLAYER_ID_HEADER = "X-Player-Id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlayerId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Refuses a request whose X-Player-Id is missing or not a UUID. */
export const requirePlayerId: MiddlewareHandler<PlayerIdEnv> = async (context, next) => {
  const id = context.req.header(PLAYER_ID_HEADER);
  if (id === undefined || id === "") {
    return context.json({ error: "X-Player-Id header is required" }, 400);
  }
  if (!isPlayerId(id)) {
    return context.json({ error: "X-Player-Id must be a UUID" }, 400);
  }
  context.set("playerId", id);
  await next();
};
