import { useEffect, useMemo, useState } from "preact/hooks";
import { GameView } from "./GameView";
import { createGameApi } from "./gameApi";
import { createGameController } from "./gameController";

/** The page a player plays on: wires the controller to the view. */
export function App() {
  const controller = useMemo(() => createGameController(createGameApi()), []);
  const [state, setState] = useState(controller.getState());
  const [guess, setGuess] = useState("");

  useEffect(() => {
    const unsubscribe = controller.subscribe(() => setState(controller.getState()));
    void controller.load();
    return unsubscribe;
  }, [controller]);

  return (
    <GameView
      state={state}
      guess={guess}
      onGuessChange={setGuess}
      onSubmit={() =>
        void controller.submit(guess).then((sent) => {
          if (sent) setGuess("");
        })
      }
    />
  );
}
