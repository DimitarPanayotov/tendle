import { Hono } from "hono";
import { describe, expect, test } from "vitest";
import { type PlayerIdEnv, requirePlayerId } from "./playerId";

function app(): Hono<PlayerIdEnv> {
  const app = new Hono<PlayerIdEnv>();
  app.use("/api/*", requirePlayerId);
  app.get("/api/me", (context) => context.json({ id: context.get("playerId") }));
  return app;
}

const ID = "3b241101-e2bb-4255-8caf-4136c566a962";

describe("requirePlayerId", () => {
  test("a request without X-Player-Id gets a 400 with a short reason", async () => {
    const response = await app().request("/api/me");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "X-Player-Id header is required" });
  });

  test("a malformed id gets a 400", async () => {
    const response = await app().request("/api/me", { headers: { "X-Player-Id": "not-a-uuid" } });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "X-Player-Id must be a UUID" });
  });

  test("a valid UUID reaches the route", async () => {
    const response = await app().request("/api/me", { headers: { "X-Player-Id": ID } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ID });
  });
});
