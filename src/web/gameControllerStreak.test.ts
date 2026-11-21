import { describe, expect, test } from "vitest";
import type { GameApi, GuessReply, Today } from "./gameApi";
import { createGameController } from "./gameController";

const TODAY: Today = { gameNumber: 7, title: "Fruits", slots: [{ rank: 1 }], found: [], strikesLeft: 3 };
const reply = (over: boolean): GuessReply => ({ outcome: "strike", found: [], strikesLeft: 0, over });

function make(api: Partial<GameApi>) {
  return createGameController({ today: async () => TODAY, guess: async () => reply(true), ...api });
}
const streakOf = (c: ReturnType<typeof make>) => {
  const s = c.getState();
  return s.status === "playing" ? s.streak : "not playing";
};

describe("game controller streak", () => {
  test("loads the streak after today's game, and again once the round is over", async () => {
    let days = 2;
    const controller = make({ streak: async () => days });
    await controller.load();
    expect(streakOf(controller)).toBe(2);
    days = 3;
    await controller.submit("x");
    expect(streakOf(controller)).toBe(3);
  });

  test("does not ask again while the round goes on", async () => {
    let calls = 0;
    const controller = make({
      guess: async () => reply(false),
      streak: async () => ++calls,
    });
    await controller.load();
    await controller.submit("x");
    expect(calls).toBe(1);
  });

  test("a failed streak call leaves the game playing with no streak", async () => {
    const controller = make({
      streak: async () => {
        throw new Error("down");
      },
    });
    await controller.load();
    expect(streakOf(controller)).toBeUndefined();
    expect(controller.getState().status).toBe("playing");
  });

  test("works with an api that has no streak call", async () => {
    const controller = make({});
    await controller.load();
    expect(streakOf(controller)).toBeUndefined();
  });
});
