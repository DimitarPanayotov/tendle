// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "./App";
import type { GameApi, GuessReply, Today } from "./gameApi";

const SLOTS = Array.from({ length: 10 }, (_, index) => ({ rank: index + 1 }));
const ENTRIES = SLOTS.map(({ rank }) => ({ rank, answer: `Answer${rank}`, finders: 11 - rank }));
const END = { entries: ENTRIES, players: 10, score: 123, shareText: "Tendle #3 · 2/10\nhttps://tendle.pages.dev" };

const ENDED_BY_STRIKES: Today = {
  gameNumber: 3,
  title: "Mountains",
  slots: SLOTS,
  found: [
    { rank: 2, answer: "Answer2" },
    { rank: 5, answer: "Answer5" },
  ],
  strikesLeft: 0,
  ...END,
};

function fakeApi(today: Today, guess?: GuessReply): GameApi {
  return { today: async () => today, guess: async () => guess ?? Promise.reject(new Error("no guess")) };
}

afterEach(cleanup);

describe("the end of a round", () => {
  test("three strikes: all ten answers in rank order, finds marked, score so far", async () => {
    render(<App api={fakeApi(ENDED_BY_STRIKES)} copyText={async () => {}} />);
    await screen.findByText(/settles at midnight/);
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.getAttribute("data-rank"))).toEqual(SLOTS.map((s) => String(s.rank)));
    expect(items.map((item) => item.textContent)).toEqual(
      ENTRIES.map(
        ({ rank, finders }) =>
          `${rank}. Answer${rank} ${rank === 2 || rank === 5 ? "✓ found" : "✗ missed"} (${finders} of 10 found it)`,
      ),
    );
    expect(items.filter((item) => item.getAttribute("data-found") === "true")).toHaveLength(2);
    expect(screen.getByText(/Score so far: 123/)).toBeTruthy();
  });

  test("finding all ten ends the round and fetches the summary", async () => {
    const all = ENTRIES.map(({ rank, answer }) => ({ rank, answer }));
    const playing: Today = { ...ENDED_BY_STRIKES, found: all.slice(0, 9), strikesLeft: 3 };
    delete playing.entries;
    delete playing.players;
    delete playing.score;
    delete playing.shareText;
    const finished: Today = { ...ENDED_BY_STRIKES, found: all, strikesLeft: 3 };
    const today = vi.fn().mockResolvedValueOnce(playing).mockResolvedValue(finished);
    const guess: GuessReply = {
      outcome: "found",
      found: all,
      strikesLeft: 3,
      over: true,
      entries: all as GuessReply["entries"],
    };
    render(<App api={{ today, guess: async () => guess }} copyText={async () => {}} />);
    await screen.findByText("Strikes left: 3");
    expect(screen.queryByText(/settles at midnight/)).toBeNull();
    fireEvent.input(screen.getByLabelText("Your guess"), { target: { value: "Answer10" } });
    fireEvent.click(screen.getByRole("button", { name: "Guess" }));
    await screen.findByText(/settles at midnight/);
    expect(screen.getAllByText(/✓ found/)).toHaveLength(10);
  });

  test("when the follow-up today() fails after the last guess, the answers stay and a message says what is missing", async () => {
    const all = ENTRIES.map(({ rank, answer }) => ({ rank, answer }));
    const playing: Today = { ...ENDED_BY_STRIKES, found: all.slice(0, 9), strikesLeft: 3 };
    delete playing.entries;
    delete playing.players;
    delete playing.score;
    delete playing.shareText;
    const today = vi.fn().mockResolvedValueOnce(playing).mockRejectedValue(new Error("down"));
    const guess: GuessReply = {
      outcome: "found",
      found: all,
      strikesLeft: 3,
      over: true,
      entries: all as GuessReply["entries"],
    };
    render(<App api={{ today, guess: async () => guess }} copyText={async () => {}} />);
    await screen.findByText("Strikes left: 3");
    fireEvent.input(screen.getByLabelText("Your guess"), { target: { value: "Answer10" } });
    fireEvent.click(screen.getByRole("button", { name: "Guess" }));
    await screen.findByText(/Could not load your score/);
    expect(screen.getAllByText(/Answer\d+/)).toHaveLength(10);
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  test("Share copies the share text and says so; a refused copy says so too", async () => {
    const copyText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
    render(<App api={fakeApi(ENDED_BY_STRIKES)} copyText={copyText} />);
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    await screen.findByText("Copied to the clipboard.");
    expect(copyText).toHaveBeenCalledWith(END.shareText);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await screen.findByText(/Could not copy/);
    await waitFor(() => expect(screen.queryByText("Copied to the clipboard.")).toBeNull());
  });

  test("a round still on shows no summary and no Share button", async () => {
    const { entries, players, score, shareText, ...playing } = { ...ENDED_BY_STRIKES, strikesLeft: 2 };
    void entries;
    void players;
    void score;
    void shareText;
    render(<App api={fakeApi(playing)} />);
    await screen.findByText("Strikes left: 2");
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });
});
