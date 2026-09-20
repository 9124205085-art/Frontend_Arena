/** Calendar-day stamp (`YYYY-MM-DD`) from an ISO-like timestamp. */
export function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Hour 0–23 from a timestamp. Prefers a fast slice when the string is `…Tnn…`
 * so graph filters and insights do not construct a Date per receipt.
 */
export function hourOf(iso: string): number {
  if (iso.length >= 13 && iso.charAt(10) === "T") {
    const h = Number(iso.slice(11, 13));
    if (h >= 0 && h <= 23) return h;
  }
  const parsed = new Date(iso).getHours();
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Whole minutes between the earliest and latest timestamps in a set. */
export function spanMinutes(timestamps: string[]): number {
  if (timestamps.length < 2) return 0;
  const t = timestamps.map((iso) => new Date(iso).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  if (t.length < 2) return 0;
  return Math.round((t[t.length - 1] - t[0]) / 60000);
}
