// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GameView } from "./GameView";
import type { GameState } from "./gameController";

const PLAYING: Extract<GameState, { status: "playing" }> = {
  status: "playing",
  gameNumber: 7,
  title: "Fruits",
  slots: [{ rank: 1, answer: "Apple" }, { rank: 2 }],
  strikesLeft: 2,
  over: false,
};

function show(state: GameState, onSubmit = () => {}) {
  render(<GameView state={state} guess="pe" onGuessChange={() => {}} onSubmit={onSubmit} />);
}

afterEach(cleanup);

describe("GameView", () => {
  test("loading, no list and an unreachable server each show a message", () => {
    show({ status: "loading" });
    expect(screen.getByText(/Loading/)).toBeTruthy();
    cleanup();
    show({ status: "no-list" });
    expect(screen.getByText(/no list for today/)).toBeTruthy();
    cleanup();
    show({ status: "unreachable" });
    expect(screen.getByText(/Cannot reach the server/)).toBeTruthy();
  });

  test("shows the game number, title, numbered slots and strikes left, hiding unfound answers", () => {
    show(PLAYING);
    expect(screen.getByRole("heading", { name: /#7/ })).toBeTruthy();
    expect(screen.getByText("Fruits")).toBeTruthy();
    expect(screen.getByText("Strikes left: 2")).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["1. Apple", "2. ?"]);
  });

  test("a strike and an already-found guess are each shown", () => {
    show({ ...PLAYING, notice: "strike" });
    expect(screen.getByText("Strike!")).toBeTruthy();
    cleanup();
    show({ ...PLAYING, notice: "already-found" });
    expect(screen.getByText(/already found/)).toBeTruthy();
  });

  test("pressing the button submits the guess; a finished game disables the box", () => {
    const onSubmit = vi.fn();
    show(PLAYING, onSubmit);
    fireEvent.click(screen.getByRole("button", { name: "Guess" }));
    expect(onSubmit).toHaveBeenCalled();
    cleanup();
    show({ ...PLAYING, over: true });
    expect((screen.getByLabelText("Your guess") as HTMLInputElement).disabled).toBe(true);
  });
});
