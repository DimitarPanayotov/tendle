import type { EndEntry, FoundEntry, GameApi, GuessReply, Today } from "./gameApi";

/** How long a strike stays on screen. */
export const STRIKE_DISPLAY_MS = 1500;

export type Notice = "strike" | "already-found" | "error" | "end-error";
export type SlotView = { rank: number; answer?: string };

/** What the screen shows once the round has ended. */
export type RoundEnd = {
  entries: (EndEntry & { found: boolean })[];
  players: number;
  score: number;
  shareText: string;
};

export type GameState =
  | { status: "loading" }
  | { status: "no-list" }
  | { status: "not-started" }
  | { status: "unreachable" }
  | {
      status: "playing";
      gameNumber: number;
      title: string;
      slots: SlotView[];
      strikesLeft: number;
      over: boolean;
      notice?: Notice;
      /** Days in a row played; left out when unknown. */
      streak?: number;
      /** When the next list arrives, as the server sent it. */
      nextListAt?: string;
      end?: RoundEnd;
    };

/** Fills each slot with its answer only when the server has returned that answer. */
function fill(slots: SlotView[], entries: FoundEntry[]): SlotView[] {
  return slots.map((slot) => {
    const entry = entries.find((candidate) => candidate.rank === slot.rank);
    return entry ? { rank: slot.rank, answer: entry.answer } : slot;
  });
}

/** The round-end summary, or undefined when the server has not sent it. */
function summarize(today: Today, foundRanks: number[]): RoundEnd | undefined {
  const { entries, players, score, shareText } = today;
  if (!entries || players === undefined || score === undefined || shareText === undefined) return undefined;
  return {
    entries: entries.map((entry) => ({ ...entry, found: foundRanks.includes(entry.rank) })),
    players,
    score,
    shareText,
  };
}

/** The page's state and its calls to the API, with no view in it. */
export function createGameController(api: GameApi) {
  let state: GameState = { status: "loading" };
  let strikeTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function set(next: GameState) {
    state = next;
    for (const listener of listeners) listener();
  }

  function setNotice(notice: Notice | undefined) {
    if (state.status === "playing") set({ ...state, notice });
  }

  function apply(reply: GuessReply) {
    if (state.status !== "playing") return;
    const slots = fill(state.slots, reply.entries ?? reply.found);
    const notice = reply.outcome === "strike" || reply.outcome === "already-found" ? reply.outcome : undefined;
    set({ ...state, slots, strikesLeft: reply.strikesLeft, over: reply.over, notice });
    clearTimeout(strikeTimer);
    if (notice === "strike") strikeTimer = setTimeout(() => setNotice(undefined), STRIKE_DISPLAY_MS);
  }

  /** Asks for the streak and shows it; a failed call leaves the game as it is. */
  async function loadStreak() {
    if (!api.streak) return;
    try {
      const days = await api.streak();
      if (state.status === "playing") set({ ...state, streak: days });
    } catch {
      // The game plays on without a streak.
    }
  }

  /** Keeps the strike timer from wiping the message when it fires. */
  function showEndError() {
    clearTimeout(strikeTimer);
    setNotice("end-error");
  }

  /** Asks for today's game again to get the round-end data; the screen stays as it is when that fails. */
  async function loadEnd(foundRanks: number[]) {
    try {
      const today = await api.today();
      if (today === "no-list" || today === "not-started") return showEndError();
      if (state.status !== "playing") return;
      const end = summarize(today, foundRanks);
      if (end) set({ ...state, end });
      else showEndError();
    } catch {
      // The answers from the guess reply stay on screen; say the summary is missing.
      showEndError();
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async load() {
      set({ status: "loading" });
      try {
        const today = await api.today();
        if (today === "no-list" || today === "not-started") return set({ status: today });
        const foundRanks = today.found.map((entry) => entry.rank);
        const over = today.strikesLeft <= 0 || today.found.length >= today.slots.length;
        set({
          status: "playing",
          gameNumber: today.gameNumber,
          title: today.title,
          slots: fill(today.slots, today.found),
          strikesLeft: today.strikesLeft,
          nextListAt: today.nextListAt,
          over,
          end: over ? summarize(today, foundRanks) : undefined,
        });
        await loadStreak();
      } catch {
        set({ status: "unreachable" });
      }
    },
    /** Resolves true when the guess reached the server, so the page keeps the typed text when it did not. */
    async submit(text: string): Promise<boolean> {
      if (state.status !== "playing" || state.over || text.trim() === "") return false;
      try {
        const reply = await api.guess(text);
        apply(reply);
        if (reply.over) {
          await loadEnd(reply.found.map((entry) => entry.rank));
          await loadStreak();
        }
        return true;
      } catch {
        clearTimeout(strikeTimer);
        setNotice("error");
        return false;
      }
    },
  };
}

export type GameController = ReturnType<typeof createGameController>;
