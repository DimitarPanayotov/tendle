export const SHARE_LINK = "https://tendle.pages.dev";
export const GAME_NAME = "Tendle";
export const ENTRY_COUNT = 10;
export const RARE_SHARE = 0.1;
export const UNCOMMON_SHARE = 0.4;

const RARE_SQUARE = "🟪";
const UNCOMMON_SQUARE = "🟦";
const COMMON_SQUARE = "🟩";
const MISSED_SQUARE = "⬜";

export interface FoundEntry {
  rank: number;
  finders: number;
}

export interface ShareInput {
  gameNumber: number;
  found: FoundEntry[];
  players: number;
  score: number;
  /** The link on the last line; defaults to SHARE_LINK. */
  link?: string;
}

function squareFor(share: number): string {
  if (share < RARE_SHARE) return RARE_SQUARE;
  if (share < UNCOMMON_SHARE) return UNCOMMON_SQUARE;
  return COMMON_SQUARE;
}

export function buildShareText(input: ShareInput): string {
  const { gameNumber, found, players, score, link } = input;
  if (!Number.isInteger(gameNumber) || gameNumber < 1) {
    throw new RangeError(`Game number must be a whole number from 1 up, got ${gameNumber}`);
  }
  if (!Number.isInteger(players) || players < 1) {
    throw new RangeError(`Players must be a whole number from 1 up, got ${players}`);
  }
  if (!Number.isFinite(score)) {
    throw new RangeError(`Score must be a finite number, got ${score}`);
  }
  const byRank = new Map<number, number>();
  for (const entry of found) {
    if (!Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > ENTRY_COUNT) {
      throw new RangeError(`Rank must be a whole number from 1 to ${ENTRY_COUNT}, got ${entry.rank}`);
    }
    if (byRank.has(entry.rank)) {
      throw new RangeError(`Rank ${entry.rank} is found twice`);
    }
    if (!Number.isInteger(entry.finders) || entry.finders < 0 || entry.finders > players) {
      throw new RangeError(`Finders must be a whole number from 0 to ${players}, got ${entry.finders}`);
    }
    byRank.set(entry.rank, entry.finders);
  }
  const squares = Array.from({ length: ENTRY_COUNT }, (_, i) => {
    const finders = byRank.get(i + 1);
    return finders === undefined ? MISSED_SQUARE : squareFor(finders / players);
  }).join("");
  const first = `${GAME_NAME} #${gameNumber} · ${byRank.size}/${ENTRY_COUNT} · ${squares} · ${score}`;
  return `${first}\n${link || SHARE_LINK}`;
}
