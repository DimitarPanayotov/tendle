import { describe, expect, test } from "vitest";
import type { DailyList } from "../game/dailyList";
import { createMemoryStores } from "../game/memoryStores";
import { createApp } from "./app";

const ME = "3b241101-e2bb-4255-8caf-4136c566a962";

async function nextListAt(at: string) {
  const date = at.slice(0, 10);
  const list: DailyList = {
    date,
    title: "Tallest mountains",
    sourceUrl: "https://example.com",
    entries: Array.from({ length: 10 }, (_, index) => ({ rank: index + 1, answer: `A${index + 1}`, aliases: [] })),
  };
  const stores = createMemoryStores();
  await stores.lists.saveList(list);
  const app = createApp({ stores, now: () => new Date(at) });
  const response = await app.request("/api/today", { headers: { "X-Player-Id": ME } });
  return (await response.json()).nextListAt;
}

describe("GET /api/today nextListAt", () => {
  test("at 15:30 UTC it is the coming midnight", async () => {
    expect(await nextListAt("2026-12-01T15:30:00Z")).toBe("2026-12-02T00:00:00.000Z");
  });
  test("at 23:59:59 UTC it is the coming midnight", async () => {
    expect(await nextListAt("2026-12-01T23:59:59Z")).toBe("2026-12-02T00:00:00.000Z");
  });
  test("at midnight UTC it is the next day's", async () => {
    expect(await nextListAt("2026-12-02T00:00:00Z")).toBe("2026-12-03T00:00:00.000Z");
  });
});
