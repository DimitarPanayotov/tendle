export const LINKS = {
  wikidata: "https://www.wikidata.org/",
  musicbrainz: "https://musicbrainz.org/",
  wikipedia: "https://www.wikipedia.org/",
} as const;

/** "How to play" and "About" texts, each collapsible. */
export function InfoPanels() {
  return (
    <section aria-label="Information">
      <details>
        <summary>How to play</summary>
        <p>There is one list a day. Type your guesses to fill it in.</p>
        <p>3 wrong guesses end the round.</p>
        <p>Rare finds score more.</p>
        <p>Scores settle at midnight UTC.</p>
      </details>
      <details>
        <summary>About</summary>
        <p>
          Tendle is a daily guessing game: name the items on a top ten list. The lists are built from facts in{" "}
          <a href={LINKS.wikidata}>Wikidata</a> and <a href={LINKS.musicbrainz}>MusicBrainz</a>, with text from{" "}
          <a href={LINKS.wikipedia}>Wikipedia</a>, credited to its authors.
        </p>
      </details>
    </section>
  );
}
