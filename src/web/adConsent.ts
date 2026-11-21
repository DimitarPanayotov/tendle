export type AdConsent = "agreed" | "refused";

const KEY = "tendle-ad-consent";

/** The stored answer about ad cookies, or undefined when the player has not answered or storage is unavailable. */
export function readAdConsent(): AdConsent | undefined {
  try {
    const value = localStorage.getItem(KEY);
    return value === "agreed" || value === "refused" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Remembers the answer in localStorage, never in a cookie. Storage that refuses is ignored. */
export function saveAdConsent(consent: AdConsent): void {
  try {
    localStorage.setItem(KEY, consent);
  } catch {
    // The answer then lasts only until the page closes.
  }
}
