import { expect, test } from "vitest";
import { timeLeft } from "./timeLeft";

const TARGET = "2026-12-02T00:00:00.000Z";

test("hours and minutes", () => {
  expect(timeLeft(TARGET, new Date("2026-12-01T18:48:00Z"))).toBe("5h 12m");
});
test("partial minutes round down", () => {
  expect(timeLeft(TARGET, new Date("2026-12-01T23:58:30Z"))).toBe("0h 1m");
});
test("a passed or unreadable time shows zero", () => {
  expect(timeLeft(TARGET, new Date("2026-12-02T00:00:01Z"))).toBe("0h 0m");
  expect(timeLeft("nope", new Date())).toBe("0h 0m");
});
