import { describe, expect, test } from "vitest";
import { getPlayerId, type IdStorage, PLAYER_ID_KEY } from "./playerId";

const A = "3b241101-e2bb-4255-8caf-4136c566a962";
const B = "9b2f1c6e-7d1a-4c55-a0e3-5f1d2b7c8e90";

function memory(): IdStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("getPlayerId", () => {
  test("makes an id once and keeps it in storage", () => {
    const storage = memory();
    let made = 0;
    const generate = () => (++made === 1 ? A : B);
    expect(getPlayerId(storage, generate)).toBe(A);
    expect(getPlayerId(storage, generate)).toBe(A);
    expect(made).toBe(1);
    expect([...storage.data.values()]).toEqual([A]);
  });

  test("reuses a UUID already in storage", () => {
    const storage = memory();
    storage.setItem(PLAYER_ID_KEY, A);
    expect(getPlayerId(storage, () => B)).toBe(A);
  });

  test("replaces a stored value that is not a UUID", () => {
    const storage = memory();
    storage.setItem(PLAYER_ID_KEY, "old-format");
    expect(getPlayerId(storage, () => B)).toBe(B);
    expect(storage.getItem(PLAYER_ID_KEY)).toBe(B);
  });
});
