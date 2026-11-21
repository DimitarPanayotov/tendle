// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
import { GameView } from "./GameView";
import type { GameState } from "./gameController";

const PLAYING: GameState = {
  status: "playing",
  gameNumber: 7,
  title: "Fruits",
  slots: [{ rank: 1 }],
  strikesLeft: 3,
  over: false,
};

function show(state: GameState) {
  render(<GameView state={state} guess="" onGuessChange={() => {}} onSubmit={() => {}} />);
}

afterEach(cleanup);

describe("InfoPanels in GameView", () => {
  test("shows a How to play section with the rules", () => {
    show(PLAYING);
    expect(screen.getByText("How to play")).toBeTruthy();
    expect(screen.getByText(/one list a day/)).toBeTruthy();
    expect(screen.getByText(/Type your guesses/)).toBeTruthy();
    expect(screen.getByText(/3 wrong guesses end the round/)).toBeTruthy();
    expect(screen.getByText(/Rare finds score more/)).toBeTruthy();
    expect(screen.getByText(/midnight UTC/)).toBeTruthy();
  });

  test("shows an About section crediting Wikipedia with links to the sources", () => {
    show(PLAYING);
    expect(screen.getByText("About")).toBeTruthy();
    expect(screen.getByText(/Tendle is a daily guessing game/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Wikidata" }).getAttribute("href")).toBe("https://www.wikidata.org/");
    expect(screen.getByRole("link", { name: "MusicBrainz" }).getAttribute("href")).toBe("https://musicbrainz.org/");
    expect(screen.getByRole("link", { name: "Wikipedia" }).getAttribute("href")).toBe("https://www.wikipedia.org/");
  });

  test("the sections stay reachable when there is no list", () => {
    show({ status: "no-list" });
    expect(screen.getByText("How to play")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
  });
});
