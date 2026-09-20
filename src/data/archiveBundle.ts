import { parseCsv } from "./csv";
import { fromHousehold, fromIndia, fromSpotify } from "./normalize";
import { detectConnections } from "./connectionEngine";
import { detectChapters } from "./chapterEngine";
import type { HouseholdRow, IndiaRow, Receipt, SpotifyRow } from "./types";
import { dedupeReceipts } from "../lib/validateReceipt";
import { getLocationStats, getOverview, getPatterns, getYears } from "../domain/insights";

export function receiptsFromCsvTexts(householdText: string, spotifyText: string, indiaText: string): Receipt[] {
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

  return dedupeReceipts(receipts).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Parse the three official CSV texts into receipts, then compute connections,
 * chapters, overview stats, and discovery patterns in one pass.
 * Pipeline used by the archive Web Worker (and the main-thread fallback).
 * Parse/normalize/connect live in `data/`; overview and patterns come from `domain/insights`.
 */
export function buildArchiveBundle(householdText: string, spotifyText: string, indiaText: string) {
  const receipts = receiptsFromCsvTexts(householdText, spotifyText, indiaText);
  const edges = detectConnections(receipts);
  const chapters = detectChapters(receipts);
  return {
    receipts,
    edges,
    chapters,
    presentTypes: [...new Set(receipts.map((r) => r.type))],
    overview: getOverview(receipts),
    patterns: getPatterns(receipts),
    years: getYears(receipts),
    locationStats: getLocationStats(receipts).slice(0, 40),
  };
}
