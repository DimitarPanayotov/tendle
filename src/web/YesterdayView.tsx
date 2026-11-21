import { useEffect, useState } from "preact/hooks";
import { AdSlot } from "./AdSlot";
import type { Results, ResultsApi } from "./resultsApi";

type State =
  | { status: "loading" }
  | { status: "unreachable" }
  | { status: "not-settled" }
  | { status: "ready"; results: Results };

const share = (foundBy: number, players: number) => (players > 0 ? `${Math.round((foundBy / players) * 100)}%` : "0%");

/** Yesterday's results: the player's score and how many players found each entry. */
export function YesterdayView({ api, date }: { api: ResultsApi; date: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    api.results(date).then(
      (reply) =>
        active && setState(reply === "not-settled" ? { status: "not-settled" } : { status: "ready", results: reply }),
      () => active && setState({ status: "unreachable" }),
    );
    return () => {
      active = false;
    };
  }, [api, date]);

  if (state.status === "loading") return <p role="status">Loading yesterday's results…</p>;
  if (state.status === "unreachable")
    return <p role="status">Cannot reach the server. Check your connection and try again.</p>;
  if (state.status === "not-settled")
    return <p role="status">Yesterday's results are not ready yet. Come back later.</p>;
  const { results } = state;
  if (results.score === null || results.foundRanks === null) {
    return <p role="status">You did not play yesterday.</p>;
  }
  const mine = results.foundRanks;
  return (
    <section aria-label="Yesterday">
      <p>Your score: {results.score}</p>
      <ol>
        {results.entries.map((entry) => (
          <li key={entry.rank} data-rank={entry.rank} data-found={mine.includes(entry.rank) ? "true" : "false"}>
            {mine.includes(entry.rank) ? "✓ " : ""}
            {entry.rank}. {entry.answer} — {share(entry.foundBy, results.players)} of players
          </li>
        ))}
      </ol>
      <AdSlot />
    </section>
  );
}
