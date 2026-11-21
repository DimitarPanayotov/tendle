// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
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

function show(streak?: number) {
  render(<GameView state={{ ...base, streak }} guess="" onGuessChange={() => {}} onSubmit={() => {}} />);
}

afterEach(cleanup);

describe("GameView streak", () => {
  test("shows days for a run", () => {
    show(4);
    expect(screen.getByText("🔥 4 days")).toBeTruthy();
  });
  test("shows the singular for 1", () => {
    show(1);
    expect(screen.getByText("🔥 1 day")).toBeTruthy();
  });
  test("shows nothing for 0 or unknown", () => {
    show(0);
    expect(screen.queryByText(/🔥/)).toBeNull();
    cleanup();
    show(undefined);
    expect(screen.queryByText(/🔥/)).toBeNull();
  });
});
