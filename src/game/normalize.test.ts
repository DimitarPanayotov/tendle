import { describe, expect, test } from "vitest";
import { normalize } from "./normalize";

describe("normalize", () => {
  test("ignores case, accents and the spaces around a guess", () => {
    expect(normalize("  Beyoncé ")).toBe("beyonce");
  });

  test("turns punctuation into single spaces", () => {
    expect(normalize("Man. Utd!")).toBe("man utd");
    expect(normalize("AC/DC")).toBe("ac dc");
  });

  test("keeps digits and letters of any alphabet", () => {
    expect(normalize("Blink-182")).toBe("blink 182");
    expect(normalize("София")).toBe("софия");
  });

  test("leaves nothing of a guess made only of punctuation", () => {
    expect(normalize(" ?! ")).toBe("");
  });
});
