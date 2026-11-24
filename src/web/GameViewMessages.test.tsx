// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
import { GameView } from "./GameView";
import type { GameState } from "./gameController";

function show(state: GameState) {
  render(<GameView state={state} guess="" onGuessChange={() => {}} onSubmit={() => {}} />);
}

afterEach(cleanup);

describe("GameView messages", () => {
  test("before launch it says when Tendle starts", () => {
    show({ status: "not-started" });
    expect(screen.getByText("Tendle starts on 1 December 2026.")).toBeTruthy();
    expect(screen.queryByText(/no list for today/)).toBeNull();
  });

  test("after launch a day with no list says to come back later", () => {
    show({ status: "no-list" });
    expect(screen.getByText("There is no list for today. Come back later.")).toBeTruthy();
    expect(screen.queryByText(/starts on/)).toBeNull();
  });
});
