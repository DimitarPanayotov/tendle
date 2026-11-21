export const PLAYER_ID_KEY = "tendle.playerId";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IdStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** The player's id: read from storage, or made once and kept there. A stored value that is not a UUID is replaced. */
export function getPlayerId(storage: IdStorage, generate: () => string): string {
  const existing = storage.getItem(PLAYER_ID_KEY);
  if (existing && UUID.test(existing)) return existing;
  const id = generate();
  storage.setItem(PLAYER_ID_KEY, id);
  return id;
}

/** The id for this browser, made with crypto.randomUUID(). */
export function browserPlayerId(): string {
  return getPlayerId(localStorage, () => crypto.randomUUID());
}
