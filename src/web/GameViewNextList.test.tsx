// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, expect, test } from "vitest";
import { GameView } from "./GameView";
import type { GameState } from "./gameController";

const base: Extract<GameState, { status: "playing" }> = {
  status: "playing",
  gameNumber: 7,
  title: "Fruits",
  slots: [{ rank: 1 }],
  strikesLeft: 2,
  over: false,
};

afterEach(cleanup);

test("shows the time left until the next list", () => {
  const state = { ...base, nextListAt: "2026-12-02T00:00:00.000Z" };
  render(
    <GameView
      state={state}
      now={new Date("2026-12-01T18:48:00Z")}
      guess=""
      onGuessChange={() => {}}
      onSubmit={() => {}}
    />,
  );
  expect(screen.getByText("Next list in 5h 12m")).toBeTruthy();
});

test("shows nothing when the server sent no time", () => {
  render(<GameView state={base} guess="" onGuessChange={() => {}} onSubmit={() => {}} />);
  expect(screen.queryByText(/Next list in/)).toBeNull();
});
