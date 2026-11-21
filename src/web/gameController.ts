import type { FoundEntry, GameApi, GuessReply } from "./gameApi";

/** How long a strike stays on screen. */
export const STRIKE_DISPLAY_MS = 1500;

export type Notice = "strike" | "already-found" | "error";
export type SlotView = { rank: number; answer?: string };

export type GameState =
  | { status: "loading" }
  | { status: "no-list" }
  | { status: "unreachable" }
  | {
      status: "playing";
      gameNumber: number;
      title: string;
      slots: SlotView[];
      strikesLeft: number;
      over: boolean;
      notice?: Notice;
    };

/** Fills each slot with its answer only when the server has returned that answer. */
function fill(slots: SlotView[], entries: FoundEntry[]): SlotView[] {
  return slots.map((slot) => {
    const entry = entries.find((candidate) => candidate.rank === slot.rank);
    return entry ? { rank: slot.rank, answer: entry.answer } : slot;
  });
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
        if (today === "no-list") return set({ status: "no-list" });
        set({
          status: "playing",
          gameNumber: today.gameNumber,
          title: today.title,
          slots: fill(today.slots, today.found),
          strikesLeft: today.strikesLeft,
          over: today.strikesLeft <= 0 || today.found.length >= today.slots.length,
        });
      } catch {
        set({ status: "unreachable" });
      }
    },
    /** Resolves true when the guess reached the server, so the page keeps the typed text when it did not. */
    async submit(text: string): Promise<boolean> {
      if (state.status !== "playing" || state.over || text.trim() === "") return false;
      try {
        apply(await api.guess(text));
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
