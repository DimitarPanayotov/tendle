import { describe, expect, test } from "vitest";
import { createGameController } from "./gameController";

describe("game controller before launch", () => {
  test("shows not-started when the api says so", async () => {
    const controller = createGameController({
      today: async () => "not-started",
      guess: async () => {
        throw new Error("no");
      },
    });
    await controller.load();
    expect(controller.getState().status).toBe("not-started");
  });
});
