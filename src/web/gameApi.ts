import { apiFetch } from "./api";

export type FoundEntry = { rank: number; answer: string };

/** The shape of GET /api/today. */
export type Today = {
  gameNumber: number;
  title: string;
  slots: { rank: number }[];
  found: FoundEntry[];
  strikesLeft: number;
  /** The four below come only once the player's round is over. */
  entries?: EndEntry[];
  players?: number;
  score?: number;
  shareText?: string;
};

export type EndEntry = { rank: number; answer: string; finders: number };

export type GuessOutcome = "found" | "strike" | "already-found" | "refused";

/** The shape of POST /api/guess; `entries` comes only once the round is over. */
export type GuessReply = {
  outcome: GuessOutcome;
  entry?: FoundEntry;
  found: FoundEntry[];
  strikesLeft: number;
  over: boolean;
  entries?: FoundEntry[];
};

/** What the page needs from the server. Both calls reject when the server cannot be reached or answers badly. */
export type GameApi = {
  /** Today's game, "not-started" before launch day, or "no-list" when the server has none for today. */
  today(): Promise<Today | "no-list" | "not-started">;
  guess(text: string): Promise<GuessReply>;
  /** The player's current streak in days; rejects when the server cannot be reached or answers badly. */
  streak?(): Promise<number>;
};

const NOT_FOUND = 404;
const NOT_STARTED_ERROR = "The game has not started yet";
async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`The server answered ${response.status}`);
  return (await response.json()) as T;
}

/** The real API, over HTTP with the player's id. */
export function createGameApi(fetchApi: typeof apiFetch = apiFetch): GameApi {
  return {
    async today() {
      const response = await fetchApi("/api/today");
      if (response.status === NOT_FOUND) {
        const body = (await response.json().catch(() => undefined)) as { error?: unknown } | undefined;
        return body?.error === NOT_STARTED_ERROR ? "not-started" : "no-list";
      }
      return readJson<Today>(response);
    },
    async guess(text) {
      const response = await fetchApi("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: text }),
      });
      return readJson<GuessReply>(response);
    },
    async streak() {
      return (await readJson<{ streak: number }>(await fetchApi("/api/streak"))).streak;
    },
  };
}
