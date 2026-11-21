import { useEffect, useMemo, useState } from "preact/hooks";
import { GameView } from "./GameView";
import { createGameApi, type GameApi } from "./gameApi";
import { createGameController } from "./gameController";
import { createResultsApi, yesterdayUtc } from "./resultsApi";
import { YesterdayView } from "./YesterdayView";

/** The page a player plays on: wires the controller to the view. */
export function App({
  api,
  copyText = (text: string) => navigator.clipboard.writeText(text),
}: {
  api?: GameApi;
  /** Puts text on the clipboard; rejects when it cannot. */
  copyText?: (text: string) => Promise<void>;
} = {}) {
  const controller = useMemo(() => createGameController(api ?? createGameApi()), [api]);
  const [shareNotice, setShareNotice] = useState<"copied" | "failed" | undefined>();
  const [state, setState] = useState(controller.getState());
  const [guess, setGuess] = useState("");
  const resultsApi = useMemo(() => createResultsApi(), []);
  const [showYesterday, setShowYesterday] = useState(false);

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => setState(controller.getState()));
    void controller.load();
    return unsubscribe;
  }, [controller]);

  return (
    <>
      <GameView
        state={state}
        guess={guess}
        shareNotice={shareNotice}
        onShare={() => {
          const end = state.status === "playing" ? state.end : undefined;
          if (!end) return;
          void Promise.resolve()
            .then(() => copyText(end.shareText))
            .then(
              () => setShareNotice("copied"),
              () => setShareNotice("failed"),
            );
        }}
        onGuessChange={setGuess}
        onSubmit={() =>
          void controller.submit(guess).then((sent) => {
            if (sent) setGuess("");
          })
        }
      />
      <button type="button" onClick={() => setShowYesterday(!showYesterday)}>
        Yesterday
      </button>
      {showYesterday ? <YesterdayView api={resultsApi} date={yesterdayUtc()} /> : null}
    </>
  );
}
