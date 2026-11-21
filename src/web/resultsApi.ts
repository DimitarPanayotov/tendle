import { apiFetch } from "./api";

export type ResultEntry = { rank: number; answer: string; foundBy: number };

/** The shape of GET /api/results/:date. */
export type Results = {
  date: string;
  players: number;
  entries: ResultEntry[];
  score: number | null;
  foundRanks: number[] | null;
};

/** Yesterday's results, or "not-settled" when the server has not settled that day. Rejects on any other failure. */
export type ResultsApi = {
  results(date: string): Promise<Results | "not-settled">;
};

/** The previous UTC calendar date as YYYY-MM-DD. */
export function yesterdayUtc(now: Date = new Date()): string {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The real results API, over HTTP with the player's id. */
export function createResultsApi(fetchApi: typeof apiFetch = apiFetch): ResultsApi {
  return {
    async results(date) {
      const response = await fetchApi(`/api/results/${date}`);
      if (response.status === 404) return "not-settled";
      if (!response.ok) throw new Error(`The server answered ${response.status}`);
      return (await response.json()) as Results;
    },
  };
}
