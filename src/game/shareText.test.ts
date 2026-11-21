import { describe, expect, it } from "vitest";
import { buildShareText } from "./shareText";

const found = [
  { rank: 1, finders: 5 },
  { rank: 2, finders: 50 },
  { rank: 3, finders: 30 },
  { rank: 4, finders: 10 },
  { rank: 5, finders: 39 },
  { rank: 6, finders: 40 },
  { rank: 7, finders: 90 },
];

function make(over: Partial<Parameters<typeof buildShareText>[0]> = {}) {
  return buildShareText({ gameNumber: 12, found, players: 100, score: 640, ...over });
}

describe("buildShareText", () => {
  it("builds the text for a round with 7 found entries", () => {
    expect(
      make({
        found: [
          { rank: 1, finders: 5 },
          { rank: 2, finders: 8 },
          { rank: 3, finders: 20 },
          { rank: 4, finders: 30 },
          { rank: 5, finders: 39 },
          { rank: 6, finders: 40 },
          { rank: 7, finders: 90 },
        ],
      }),
    ).toBe("Tendle #12 · 7/10 · 🟪🟪🟦🟦🟦🟩🟩⬜⬜⬜ · 640\nhttps://tendle.pages.dev");
  });

  it("colours at the thresholds: 10% is blue, 40% is green", () => {
    expect(make().split("\n")[0]).toBe("Tendle #12 · 7/10 · 🟪🟩🟦🟦🟦🟩🟩⬜⬜⬜ · 640");
  });

  it("places squares by rank, not by input order", () => {
    const text = make({
      found: [
        { rank: 10, finders: 1 },
        { rank: 1, finders: 99 },
      ],
    });
    expect(text.split("\n")[0]).toBe("Tendle #12 · 2/10 · 🟩⬜⬜⬜⬜⬜⬜⬜⬜🟪 · 640");
  });

  it("shows ten missed squares when nothing was found", () => {
    expect(make({ found: [] }).split("\n")[0]).toBe("Tendle #12 · 0/10 · ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ · 640");
  });

  it("ends with the link on its own last line", () => {
    const lines = make().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("https://tendle.pages.dev");
  });

  it("carries only the number, squares, score and link: no names", () => {
    const text = make();
    expect(text).toMatch(/^Tendle #12 · 7\/10 · [🟪🟦🟩⬜]{10} · 640\nhttps:\/\/tendle\.pages\.dev$/u);
  });

  it.each([null, 0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("refuses game number %s", (n) => {
    expect(() => make({ gameNumber: n as number })).toThrow(RangeError);
    expect(() => make({ gameNumber: n as number })).toThrow(/Game number/);
  });

  it("accepts game number 1", () => {
    expect(make({ gameNumber: 1 })).toContain("Tendle #1 ·");
  });

  it.each([0, 11, 1.5, -1])("refuses rank %s", (rank) => {
    expect(() => make({ found: [{ rank, finders: 1 }] })).toThrow(/Rank must be/);
  });

  it("refuses a duplicate rank", () => {
    expect(() =>
      make({
        found: [
          { rank: 1, finders: 1 },
          { rank: 1, finders: 2 },
        ],
      }),
    ).toThrow(/twice/);
  });

  it.each([0, -5, 1.5, Number.NaN])("refuses %s players", (players) => {
    expect(() => make({ players })).toThrow(/Players must be/);
  });

  it.each([-1, 101, 2.5])("refuses %s finders out of 100 players", (finders) => {
    expect(() => make({ found: [{ rank: 1, finders }] })).toThrow(/Finders must be/);
  });

  it("refuses a score that is not a number", () => {
    expect(() => make({ score: Number.NaN })).toThrow(/Score must be/);
  });
});
