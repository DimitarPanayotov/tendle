const MS_PER_DAY = 86_400_000;

/** The next midnight UTC after the moment: exactly midnight counts as the start of a day, so it gives the one after. */
export function nextListAt(moment: Date): Date {
  const ms = moment.getTime();
  if (Number.isNaN(ms)) throw new RangeError("nextListAt needs a valid moment");
  return new Date((Math.floor(ms / MS_PER_DAY) + 1) * MS_PER_DAY);
}
