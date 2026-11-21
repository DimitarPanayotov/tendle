import { describe, expect, it } from "vitest";
import { gameDay, LAUNCH_DAY } from "./gameDay";

describe("gameDay", () => {
  it("names launch day as game 1", () => {
    expect(LAUNCH_DAY).toBe("2026-12-01");
    expect(gameDay(new Date("2026-12-01T12:00:00Z"))).toEqual({ date: "2026-12-01", gameNumber: 1 });
  });

  it("starts launch day exactly at midnight UTC", () => {
    expect(gameDay(new Date("2026-12-01T00:00:00.000Z"))).toEqual({ date: "2026-12-01", gameNumber: 1 });
  });

  it("changes day just after midnight UTC", () => {
    expect(gameDay(new Date("2026-12-01T23:59:59.999Z"))).toEqual({ date: "2026-12-01", gameNumber: 1 });
    expect(gameDay(new Date("2026-12-02T00:00:00.000Z"))).toEqual({ date: "2026-12-02", gameNumber: 2 });
  });

  it("has no number just before launch", () => {
    expect(gameDay(new Date("2026-11-30T23:59:59.999Z"))).toEqual({ date: "2026-11-30", gameNumber: null });
  });

  it("has no number long before launch", () => {
    expect(gameDay(new Date("2020-01-01T00:00:00Z")).gameNumber).toBeNull();
  });

  it("counts across a year boundary", () => {
    expect(gameDay(new Date("2027-01-01T00:00:00Z"))).toEqual({ date: "2027-01-01", gameNumber: 32 });
  });

  it("accepts epoch milliseconds", () => {
    expect(gameDay(Date.UTC(2026, 11, 3, 5))).toEqual({ date: "2026-12-03", gameNumber: 3 });
  });

  it("rejects an invalid moment", () => {
    expect(() => gameDay(new Date("nope"))).toThrow(RangeError);
    expect(() => gameDay(Number.NaN)).toThrow(RangeError);
  });
});
