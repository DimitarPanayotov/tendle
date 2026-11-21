import { useState } from "preact/hooks";
import { type AdConsent, readAdConsent, saveAdConsent } from "./adConsent";

/** Asks whether ad cookies are welcome, remembers the answer and lets the player change it later. */
export function ConsentBanner() {
  const [consent, setConsent] = useState<AdConsent | undefined>(() => readAdConsent());
  const [changing, setChanging] = useState(false);

  const answer = (value: AdConsent) => {
    saveAdConsent(value);
    setConsent(value);
    setChanging(false);
  };

  if (consent && !changing) {
    return (
      <div>
        <button type="button" onClick={() => setChanging(true)}>
          Ad cookie settings
        </button>
      </div>
    );
  }
  return (
    <section aria-label="Ad cookies">
      <p>May Tendle use cookies for ads?</p>
      <button type="button" onClick={() => answer("agreed")}>
        Agree
      </button>
      <button type="button" onClick={() => answer("refused")}>
        Refuse
      </button>
    </section>
  );
}
