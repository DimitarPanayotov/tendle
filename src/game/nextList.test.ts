import { expect, test } from "vitest";
import { nextListAt } from "./nextList";

test("mid-afternoon gives the coming midnight", () => {
  expect(nextListAt(new Date("2026-12-01T15:30:00Z")).toISOString()).toBe("2026-12-02T00:00:00.000Z");
});
test("the last second of a day gives the coming midnight", () => {
  expect(nextListAt(new Date("2026-12-01T23:59:59Z")).toISOString()).toBe("2026-12-02T00:00:00.000Z");
});
test("exactly midnight gives the one after", () => {
  expect(nextListAt(new Date("2026-12-02T00:00:00Z")).toISOString()).toBe("2026-12-03T00:00:00.000Z");
});
test("an invalid moment is refused", () => {
  expect(() => nextListAt(new Date("nope"))).toThrow(RangeError);
});
