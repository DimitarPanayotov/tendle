// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
import type { Results, ResultsApi } from "./resultsApi";
import { YesterdayView } from "./YesterdayView";

afterEach(cleanup);

const settled: Results = {
  date: "2026-12-03",
  players: 4,
  score: 12,
  foundRanks: [1, 3],
  entries: [
    { rank: 1, answer: "Apple", foundBy: 4 },
    { rank: 2, answer: "Pear", foundBy: 1 },
    { rank: 3, answer: "Plum", foundBy: 2 },
  ],
};

function show(reply: Results | "not-settled" | Error) {
  const asked: string[] = [];
  const api: ResultsApi = {
    results: async (date) => {
      asked.push(date);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
  render(<YesterdayView api={api} date="2026-12-03" />);
  return asked;
}

describe("YesterdayView", () => {
  test("a settled day shows the score, each share and marks the player's finds", async () => {
    const asked = show(settled);
    expect(await screen.findByText("Your score: 12")).toBeTruthy();
    expect(asked).toEqual(["2026-12-03"]);
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "✓ 1. Apple — 100% of players",
      "2. Pear — 25% of players",
      "✓ 3. Plum — 50% of players",
    ]);
    expect(items.map((item) => item.getAttribute("data-found"))).toEqual(["true", "false", "true"]);
  });

  test("a day not settled shows a short message", async () => {
    show("not-settled");
    expect(await screen.findByText(/not ready yet/)).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("a day the player missed shows a short message", async () => {
    show({ ...settled, score: null, foundRanks: null });
    expect(await screen.findByText("You did not play yesterday.")).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("an unreachable server shows a message", async () => {
    show(new Error("down"));
    expect(await screen.findByText(/Cannot reach the server/)).toBeTruthy();
  });
});
