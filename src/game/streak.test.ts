import { describe, expect, it } from "vitest";
import { streak } from "./streak";

describe("streak", () => {
  it("counts an unbroken run ending today", () => {
    expect(streak(["2026-11-19", "2026-11-20", "2026-11-21"], "2026-11-21")).toBe(3);
  });

  it("counts a run ending yesterday", () => {
    expect(streak(["2026-11-19", "2026-11-20"], "2026-11-21")).toBe(2);
  });

  it("stops at a gap", () => {
    expect(streak(["2026-11-17", "2026-11-19", "2026-11-20", "2026-11-21"], "2026-11-21")).toBe(3);
  });

  it("is zero when the last round was before yesterday", () => {
    expect(streak(["2026-11-18"], "2026-11-21")).toBe(0);
  });

  it("is zero with no rounds", () => {
    expect(streak([], "2026-11-21")).toBe(0);
  });

  it("ignores duplicate dates and input order", () => {
    expect(streak(["2026-11-21", "2026-11-20", "2026-11-21"], "2026-11-21")).toBe(2);
  });

  it("works across month and year boundaries", () => {
    expect(streak(["2025-12-31", "2026-01-01"], "2026-01-01")).toBe(2);
  });

  it.each(["", "2026-1-5", "21-11-2026", "2026-13-01", "2026-02-30", "2026-11-31", "not a date"])(
    "refuses a malformed or impossible today %j",
    (bad) => {
      expect(() => streak([], bad)).toThrow(RangeError);
    },
  );

  it.each(["", "2026-1-5", "2026-02-30", "2026-00-10", "2026-11-00", "nope"])(
    "refuses a malformed or impossible finished date %j",
    (bad) => {
      expect(() => streak(["2026-11-20", bad], "2026-11-21")).toThrow(RangeError);
    },
  );

  it("accepts a real leap day", () => {
    expect(streak(["2028-02-29"], "2028-03-01")).toBe(1);
  });
});
