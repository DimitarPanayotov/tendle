import { describe, expect, test } from "vitest";
import type { apiFetch } from "./api";
import { createGameApi } from "./gameApi";

function fake(respond: () => Response) {
  const calls: { path: string; init?: RequestInit }[] = [];
  const fetchApi: typeof apiFetch = async (path, init) => {
    calls.push({ path, init });
    return respond();
  };
  return { api: createGameApi(fetchApi), calls };
}

describe("game api", () => {
  test("reads today's game from GET /api/today", async () => {
    const today = { gameNumber: 1, title: "T", slots: [], found: [], strikesLeft: 3 };
    const { api, calls } = fake(() => Response.json(today));
    expect(await api.today()).toEqual(today);
    expect(calls[0]?.path).toBe("/api/today");
  });

  test("a 404 means no list today and a server error rejects", async () => {
    expect(await fake(() => Response.json({}, { status: 404 })).api.today()).toBe("no-list");
    await expect(fake(() => new Response("boom", { status: 500 })).api.today()).rejects.toThrow();
  });

  test("posts the guess as JSON to /api/guess", async () => {
    const { api, calls } = fake(() => Response.json({ outcome: "strike", found: [], strikesLeft: 2, over: false }));
    expect((await api.guess("pear")).outcome).toBe("strike");
    expect(calls[0]?.path).toBe("/api/guess");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ guess: "pear" }));
  });

  test("a refused guess rejects", async () => {
    await expect(fake(() => Response.json({}, { status: 400 })).api.guess("")).rejects.toThrow();
  });
});
