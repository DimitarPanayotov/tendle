import { describe, expect, test } from "vitest";
import { createResultsApi, yesterdayUtc } from "./resultsApi";

const reply = (status: number, body: unknown = {}) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof import("./api").apiFetch;

describe("createResultsApi", () => {
  test("asks for the date and returns the results", async () => {
    let path = "";
    const body = { date: "2026-12-03", players: 1, entries: [], score: 5, foundRanks: [1] };
    const api = createResultsApi((async (p: string) => {
      path = p;
      return new Response(JSON.stringify(body));
    }) as unknown as typeof import("./api").apiFetch);
    expect(await api.results("2026-12-03")).toEqual(body);
    expect(path).toBe("/api/results/2026-12-03");
  });

  test("a 404 means not settled; other failures reject", async () => {
    expect(await createResultsApi(reply(404)).results("2026-12-03")).toBe("not-settled");
    await expect(createResultsApi(reply(500)).results("2026-12-03")).rejects.toThrow();
  });
});

describe("yesterdayUtc", () => {
  test("is the previous UTC date", () => {
    expect(yesterdayUtc(new Date("2026-01-01T00:30:00Z"))).toBe("2025-12-31");
  });
});
