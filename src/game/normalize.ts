/**
 * The form a guess and a list entry are compared in. Players type fast on a
 * phone, so case, accents, punctuation and extra spaces must not cost them a
 * strike: "  Beyoncé! " and "beyonce" are the same answer.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
