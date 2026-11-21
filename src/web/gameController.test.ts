import { describe, expect, test, vi } from "vitest";
import type { GameApi, GuessReply, Today } from "./gameApi";
import { createGameController, STRIKE_DISPLAY_MS } from "./gameController";

const TODAY: Today = {
  gameNumber: 7,
  title: "Fruits",
  slots: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
  found: [],
  strikesLeft: 3,
};
const PEAR = { rank: 2, answer: "Pear" };

const reply = (partial: Partial<GuessReply>): GuessReply => ({
  outcome: "found",
  found: [],
  strikesLeft: 3,
  over: false,
  ...partial,
});

async function play(api: Partial<GameApi>, text = "pear") {
  const controller = createGameController({ today: async () => TODAY, guess: async () => reply({}), ...api });
  await controller.load();
  await controller.submit(text);
  return controller;
}

function playing(controller: ReturnType<typeof createGameController>) {
  const state = controller.getState();
  if (state.status !== "playing") throw new Error(`state is ${state.status}`);
  return state;
}

describe("game controller", () => {
  test("starts loading, then shows today's game with every answer hidden", async () => {
    const controller = createGameController({ today: async () => TODAY, guess: async () => reply({}) });
    expect(controller.getState()).toEqual({ status: "loading" });
    await controller.load();
    expect(playing(controller)).toMatchObject({ gameNumber: 7, title: "Fruits", strikesLeft: 3, over: false });
    expect(playing(controller).slots).toEqual(TODAY.slots);
  });

  test("a found guess fills that entry's slot", async () => {
    const controller = await play({ guess: async () => reply({ entry: PEAR, found: [PEAR] }) });
    expect(playing(controller).slots).toEqual([{ rank: 1 }, PEAR, { rank: 3 }]);
  });

  test("a strike lowers the strikes left and shows for a short time", async () => {
    vi.useFakeTimers();
    try {
      const controller = await play({ guess: async () => reply({ outcome: "strike", strikesLeft: 2 }) });
      expect(playing(controller)).toMatchObject({ strikesLeft: 2, notice: "strike" });
      vi.advanceTimersByTime(STRIKE_DISPLAY_MS);
      expect(playing(controller).notice).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  test("an already-found guess says so", async () => {
    const controller = await play({ guess: async () => reply({ outcome: "already-found", found: [PEAR] }) });
    expect(playing(controller)).toMatchObject({ notice: "already-found", strikesLeft: 3 });
  });

  test("when the round ends the server's entries fill every slot", async () => {
    const entries = [{ rank: 1, answer: "Apple" }, PEAR, { rank: 3, answer: "Plum" }];
    const controller = await play({
      guess: async () => reply({ outcome: "strike", strikesLeft: 0, over: true, entries }),
    });
    expect(playing(controller).over).toBe(true);
    expect(playing(controller).slots).toEqual(entries);
  });

  test("no list today and an unreachable server each give a message state", async () => {
    for (const [today, status] of [
      [async () => "no-list" as const, "no-list"],
      [() => Promise.reject(new Error("offline")), "unreachable"],
    ] as const) {
      const controller = createGameController({ today, guess: async () => reply({}) });
      await controller.load();
      expect(controller.getState()).toEqual({ status });
    }
  });

  test("a guess that fails to send shows an error; a blank guess is not sent", async () => {
    const guess = vi.fn(async () => {
      throw new Error("offline");
    });
    const controller = await play({ guess }, "   ");
    expect(guess).not.toHaveBeenCalled();
    await controller.submit("pear");
    expect(playing(controller).notice).toBe("error");
  });
});
