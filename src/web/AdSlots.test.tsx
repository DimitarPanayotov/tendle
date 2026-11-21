// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "./App";
import type { GameApi, Today } from "./gameApi";
import type { Results, ResultsApi } from "./resultsApi";
import { YesterdayView } from "./YesterdayView";

afterEach(cleanup);

const SLOTS = Array.from({ length: 10 }, (_, index) => ({ rank: index + 1 }));
const ENTRIES = SLOTS.map(({ rank }) => ({ rank, answer: `Answer${rank}`, finders: 3 }));
const PLAYING: Today = {
  gameNumber: 3,
  title: "Mountains",
  slots: SLOTS,
  found: [{ rank: 2, answer: "Answer2" }],
  strikesLeft: 2,
};
const ENDED: Today = {
  ...PLAYING,
  strikesLeft: 0,
  entries: ENTRIES,
  players: 10,
  score: 5,
  shareText: "Tendle #3",
};

const api = (today: Today): GameApi => ({ today: async () => today, guess: () => Promise.reject(new Error("none")) });

const RESULTS: Results = {
  date: "2026-12-03",
  players: 4,
  score: 12,
  foundRanks: [1],
  entries: [{ rank: 1, answer: "Apple", foundBy: 4 }],
};
const resultsApi = (reply: Results | "not-settled" | Error): ResultsApi => ({
  results: async () => {
    if (reply instanceof Error) throw reply;
    return reply;
  },
});

describe("ad slots", () => {
  test("none appears while a round is being played", async () => {
    render(<App api={api(PLAYING)} />);
    await screen.findByText("Strikes left: 2");
    expect(screen.queryAllByLabelText("Ad slot")).toHaveLength(0);
  });

  test("none appears in Yesterday's results opened mid-round, but one does once the round is over", async () => {
    const yesterday = resultsApi(RESULTS);
    const open = async (today: Today) => {
      render(<App api={api(today)} resultsApi={yesterday} />);
      await screen.findByText(today.entries ? /settles at midnight/ : "Strikes left: 2");
      fireEvent.click(screen.getByRole("button", { name: "Yesterday" }));
      await screen.findByText("Your score: 12");
    };
    await open(PLAYING);
    expect(screen.queryAllByLabelText("Ad slot")).toHaveLength(0);
    cleanup();
    await open(ENDED);
    await waitFor(() => expect(screen.getAllByLabelText("Ad slot")).toHaveLength(2));
  });

  test("none appears while loading or when the server cannot be reached", async () => {
    render(
      <App api={{ today: () => Promise.reject(new Error("down")), guess: () => Promise.reject(new Error("x")) }} />,
    );
    expect(screen.queryAllByLabelText("Ad slot")).toHaveLength(0);
    await screen.findByText(/Cannot reach the server/);
    expect(screen.queryAllByLabelText("Ad slot")).toHaveLength(0);
  });

  test("one appears in the end-of-round section", async () => {
    render(<App api={api(ENDED)} />);
    await screen.findByText(/settles at midnight/);
    const slots = screen.getAllByLabelText("Ad slot");
    expect(slots).toHaveLength(1);
    expect(slots[0]?.closest("section")?.getAttribute("aria-label")).toBe("Round over");
    expect(slots[0]?.textContent).toBe("");
  });

  test("one appears in ready Yesterday results", async () => {
    render(<YesterdayView api={resultsApi(RESULTS)} date="2026-12-03" />);
    await screen.findByText("Your score: 12");
    expect(screen.getAllByLabelText("Ad slot")).toHaveLength(1);
  });

  test("none appears in the other Yesterday screens", async () => {
    for (const [reply, text] of [
      ["not-settled", /not ready yet/],
      [{ ...RESULTS, score: null, foundRanks: null }, /did not play/],
      [new Error("down"), /Cannot reach the server/],
    ] as const) {
      render(<YesterdayView api={resultsApi(reply)} date="2026-12-03" />);
      await screen.findByText(text);
      expect(screen.queryAllByLabelText("Ad slot")).toHaveLength(0);
      cleanup();
    }
  });
});
