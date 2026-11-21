import { describe, expect, test } from "vitest";
import { apiFetch } from "./api";

describe("apiFetch", () => {
  test("sends the player's id in X-Player-Id and keeps other headers", async () => {
    let seen: Headers | undefined;
    const fakeFetch = (async (_path: string, init?: RequestInit) => {
      seen = new Headers(init?.headers);
      return new Response("{}");
    }) as unknown as typeof fetch;
    await apiFetch(
      "/api/health",
      { headers: { Accept: "application/json" } },
      { playerId: () => "abc", fetch: fakeFetch },
    );
    expect(seen?.get("X-Player-Id")).toBe("abc");
    expect(seen?.get("Accept")).toBe("application/json");
  });
});
