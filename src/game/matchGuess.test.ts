import { describe, expect, it } from "vitest";
import type { DailyListEntry } from "./dailyList";
import { matchGuess } from "./matchGuess";

const entries: DailyListEntry[] = [
  { rank: 1, answer: "Beyoncé", aliases: ["Queen B"] },
  { rank: 2, answer: "Blink-182", aliases: [] },
  { rank: 3, answer: "Adele", aliases: [] },
  { rank: 4, answer: "Cher", aliases: [] },
];
const [beyonce, blink, adele, cher] = entries;

describe("matchGuess", () => {
  it("returns the entry whose answer equals the guess, ignoring case, accents and punctuation", () => {
    expect(matchGuess("BEYONCE!", entries)).toBe(beyonce);
  });

  it("returns the entry for one of its other names", () => {
    expect(matchGuess("queen b", entries)).toBe(beyonce);
  });

  it("returns no match when no entry matches", () => {
    expect(matchGuess("Madonna", entries)).toBe("no match");
    expect(matchGuess("", entries)).toBe("no match");
    expect(matchGuess("anything", [])).toBe("no match");
  });

  it("allows one wrong letter on answers of 5+ letters", () => {
    expect(matchGuess("Beyonc", entries)).toBe(beyonce); // missing
    expect(matchGuess("Beyoncee", entries)).toBe(beyonce); // added
    expect(matchGuess("Beyocnè", entries)).toBe(beyonce); // swapped
    expect(matchGuess("Beyonse", entries)).toBe(beyonce); // replaced
    expect(matchGuess("Adela", entries)).toBe(adele);
  });

  it("allows only one wrong letter", () => {
    expect(matchGuess("Beyoxsc", entries)).toBe("no match");
  });

  it("requires exact match for answers under 5 letters", () => {
    expect(matchGuess("Cher", entries)).toBe(cher);
    expect(matchGuess("Cheb", entries)).toBe("no match");
  });

  it("requires exact match when digits are involved", () => {
    expect(matchGuess("Blink-182", entries)).toBe(blink);
    expect(matchGuess("Blink-183", entries)).toBe("no match");
    expect(matchGuess("Blink", entries)).toBe("no match");
  });
});
