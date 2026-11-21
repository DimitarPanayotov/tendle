import type { GameState } from "./gameController";

export type GameViewProps = {
  state: GameState;
  guess: string;
  onGuessChange(text: string): void;
  onSubmit(): void;
};

const MESSAGES = {
  loading: "Loading today's game…",
  "no-list": "There is no list for today. Come back later.",
  unreachable: "Cannot reach the server. Check your connection and try again.",
} as const;

const NOTICES = {
  strike: "Strike!",
  "already-found": "You already found that one.",
  error: "That guess did not go through. Try again.",
} as const;

/** The game screen as a pure function of its props. */
export function GameView({ state, guess, onGuessChange, onSubmit }: GameViewProps) {
  if (state.status !== "playing") {
    return (
      <main>
        <h1>Tendle</h1>
        <p role="status">{MESSAGES[state.status]}</p>
      </main>
    );
  }
  return (
    <main>
      <h1>Tendle #{state.gameNumber}</h1>
      <h2>{state.title}</h2>
      <ol>
        {state.slots.map((slot) => (
          <li key={slot.rank} data-rank={slot.rank}>
            {slot.rank}. {slot.answer ?? "?"}
          </li>
        ))}
      </ol>
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
      <p>Strikes left: {state.strikesLeft}</p>
      {state.notice ? <p role="status">{NOTICES[state.notice]}</p> : null}
    </main>
  );
}
