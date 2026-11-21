import type { GameState } from "./gameController";
import { InfoPanels } from "./InfoPanels";

export type GameViewProps = {
  state: GameState;
  guess: string;
  onGuessChange(text: string): void;
  onSubmit(): void;
  /** Copies the share text; the view shows `shareNotice` after it. */
  onShare?(): void;
  shareNotice?: "copied" | "failed";
};

const SHARE_NOTICES = {
  copied: "Copied to the clipboard.",
  failed: "Could not copy. Select the text and copy it yourself.",
} as const;

const MESSAGES = {
  loading: "Loading today's game…",
  "no-list": "There is no list for today. Come back later.",
  unreachable: "Cannot reach the server. Check your connection and try again.",
} as const;

const NOTICES = {
  strike: "Strike!",
  "already-found": "You already found that one.",
  "end-error": "Could not load your score and share text. Reload the page to see them.",
  error: "That guess did not go through. Try again.",
} as const;

/** The game screen as a pure function of its props. */
export function GameView({ state, guess, onGuessChange, onSubmit, onShare, shareNotice }: GameViewProps) {
  if (state.status !== "playing") {
    return (
      <main>
        <h1>Tendle</h1>
        <p role="status">{MESSAGES[state.status]}</p>
        <InfoPanels />
      </main>
    );
  }
  return (
    <main>
      <h1>Tendle #{state.gameNumber}</h1>
      <h2>{state.title}</h2>
      {state.end ? (
        <ol>
          {state.end.entries.map((entry) => (
            <li key={entry.rank} data-rank={entry.rank} data-found={entry.found ? "true" : "false"}>
              {entry.rank}. {entry.answer} {entry.found ? "✓ found" : "✗ missed"} ({entry.finders} of{" "}
              {state.end?.players} found it)
            </li>
          ))}
        </ol>
      ) : (
        <ol>
          {state.slots.map((slot) => (
            <li key={slot.rank} data-rank={slot.rank}>
              {slot.rank}. {slot.answer ?? "?"}
            </li>
          ))}
        </ol>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="text"
          value={guess}
          disabled={state.over}
          aria-label="Your guess"
          onInput={(event) => onGuessChange((event.currentTarget as HTMLInputElement).value)}
        />
        <button type="submit" disabled={state.over}>
          Guess
        </button>
      </form>
      {state.streak ? <p>🔥 {state.streak === 1 ? "1 day" : `${state.streak} days`}</p> : null}
      <p>Strikes left: {state.strikesLeft}</p>
      {state.end ? (
        <section aria-label="Round over">
          <p>Score so far: {state.end.score} (settles at midnight)</p>
          <pre>{state.end.shareText}</pre>
          <button type="button" onClick={() => onShare?.()}>
            Share
          </button>
          {shareNotice ? <p role="status">{SHARE_NOTICES[shareNotice]}</p> : null}
        </section>
      ) : null}
      {state.notice ? <p role="status">{NOTICES[state.notice]}</p> : null}
      <InfoPanels />
    </main>
  );
}
