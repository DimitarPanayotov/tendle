import { describe, expect, test } from "vitest";
import type { apiFetch } from "./api";
import { createGameApi } from "./gameApi";

const api = (respond: () => Response) => createGameApi((async () => respond()) as typeof apiFetch);

describe("game api before launch", () => {
  test("a 404 with the not-started error is not-started", async () => {
    const reply = () => Response.json({ error: "The game has not started yet" }, { status: 404 });
    expect(await api(reply).today()).toBe("not-started");
  });

  test("any other 404 is still no-list", async () => {
    expect(await api(() => Response.json({ error: "There is no list for today" }, { status: 404 })).today()).toBe(
      "no-list",
    );
    expect(await api(() => new Response("gone", { status: 404 })).today()).toBe("no-list");
  });
});
