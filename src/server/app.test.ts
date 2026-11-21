import { describe, expect, test } from "vitest";
import { createApp } from "./app";

describe("the API", () => {
  test("answers a health check", async () => {
    const response = await createApp().request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("answers an unknown route with 404", async () => {
    const response = await createApp().request("/api/nothing-here");
    expect(response.status).toBe(404);
  });
});
