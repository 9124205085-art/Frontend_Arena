import { parseCsv } from "./csv";
import { fromHousehold, fromIndia, fromSpotify } from "./normalize";
import { detectConnections } from "./connectionEngine";
import { detectChapters } from "./chapterEngine";
import type { HouseholdRow, IndiaRow, Receipt, SpotifyRow } from "./types";
import { dedupeReceipts } from "../lib/validateReceipt";
import { getLocationStats, getOverview, getPatterns, getYears } from "../utils/analyzeData";

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
