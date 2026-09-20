/**
 * Loads the official archive CSVs and normalizes them.
 * Does not read public/data/bundle.json (sampled + invented derived rows).
 */

import { parseCsv } from "./csv";
import { fromHousehold, fromIndia, fromSpotify } from "./normalize";
import { OFFICIAL_SOURCES } from "./sources";
import type { HouseholdRow, IndiaRow, Receipt, SpotifyRow } from "./types";

async function fetchText(url: string, label: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not read official ${label} file (${res.status})`);
  return res.text();
}

export async function loadOfficialReceipts(): Promise<Receipt[]> {
  const [householdText, spotifyText, indiaText] = await Promise.all([
    fetchText(OFFICIAL_SOURCES.household.url, "household"),
    fetchText(OFFICIAL_SOURCES.spotify.url, "spotify"),
    fetchText(OFFICIAL_SOURCES.india.url, "india transactions"),
  ]);

  const receipts: Receipt[] = [];

  parseCsv(householdText).forEach((row, i) => {
    const r = fromHousehold(row as unknown as HouseholdRow, i);
    if (r) receipts.push(r);
  });

  parseCsv(spotifyText).forEach((row, i) => {
    const r = fromSpotify(row as unknown as SpotifyRow, i);
    if (r) receipts.push(r);
  });

  parseCsv(indiaText).forEach((row, i) => {
    const r = fromIndia(row as unknown as IndiaRow, i);
    if (r) receipts.push(r);
  });

  receipts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return receipts;
}

/** @deprecated Use loadOfficialReceipts — kept so leftover files still typecheck if imported. */
export async function loadBundle(): Promise<never> {
  throw new Error("Sample bundle disabled. The app reads the official archive CSVs.");
}

export function normalizeBundle(): Receipt[] {
  return [];
}
