import { browserPlayerId } from "./playerId";

/** fetch for the API: every request carries the player's id in X-Player-Id. */
export function apiFetch(
  path: string,
  init: RequestInit = {},
  deps: { playerId: () => string; fetch: typeof fetch } = {
    playerId: browserPlayerId,
    fetch: (input, options) => fetch(input, options),
  },
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Player-Id", deps.playerId());
  return deps.fetch(path, { ...init, headers });
}
