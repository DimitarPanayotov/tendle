import { describe, expect, test } from "vitest";
import type { apiFetch } from "./api";
import { createGameApi } from "./gameApi";

function fake(respond: () => Response) {
  const paths: string[] = [];
  const fetchApi: typeof apiFetch = async (path) => {
    paths.push(path);
    return respond();
  };
  return { api: createGameApi(fetchApi), paths };
}

describe("game api streak", () => {
  test("reads the streak from GET /api/streak", async () => {
    const { api, paths } = fake(() => Response.json({ streak: 4 }));
    expect(await api.streak?.()).toBe(4);
    expect(paths).toEqual(["/api/streak"]);
  });

  test("rejects when the server answers badly", async () => {
    await expect(fake(() => new Response("boom", { status: 500 })).api.streak?.()).rejects.toThrow();
  });
});
