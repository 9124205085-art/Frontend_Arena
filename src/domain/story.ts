import type { ConnectionEdge, Receipt } from "../data/types";
import { getRelatedReceipts, receiptsOnDay } from "./insights";
import { spanMinutes } from "./time";

export { spanMinutes } from "./time";

export type PatternLens = {
  hourLens?: "night" | "evening";
  networkMode?: "places";
  /** When false, the caller should switch network mode instead of applying a trace. */
  trace: boolean;
};

/**
 * How a discovery pattern should be shown on the Memory Network.
 * Explorer jumps to Places mode; night-owl / rituals set hour lenses first.
 */
export function patternNetworkLens(patternId: string): PatternLens {
  if (patternId === "explorer") return { networkMode: "places", trace: false };
  if (patternId === "night-owl") return { hourLens: "night", trace: true };
  if (patternId === "rituals") return { hourLens: "evening", trace: true };
  return { trace: true };
}

/**
 * Short "why this matters" copy for the story panel, derived only from
 * stored edges, location counts, and the connected path span.
 */
export function explainSelection(input: {
  edgeDetail?: string | null;
  placeCount?: number | null;
  hasReceipt: boolean;
  pathLength: number;
  spanMin: number;
  locationCount: number;
  linkCount: number;
}): string {
  if (input.edgeDetail) return input.edgeDetail;
  if (input.placeCount != null) {
    return `This location appears in ${input.placeCount.toLocaleString("en-IN")} official records.`;
  }
  if (!input.hasReceipt) return "";
  if (input.pathLength > 1 && input.spanMin > 0 && input.spanMin < 24 * 60) {
    return `${input.pathLength} receipts sit ${input.spanMin} minutes apart in the archive.`;
  }
  if (input.locationCount > 1) {
    return `This location appears in ${input.locationCount.toLocaleString("en-IN")} different moments.`;
  }
  if (input.linkCount > 0) {
    return `${input.linkCount} stored relationship${input.linkCount === 1 ? "" : "s"} connect this receipt to others.`;
  }
  return "This is an official record. No stored relationship was found among the capped connections.";
}

/**
 * Sequence shown on `/moment/:id`: seed, stored neighbors, then same-day
 * receipts of other types, capped at 6 and sorted by timestamp.
 */
export function buildMomentSequence(seed: Receipt, receipts: Receipt[], edges: ConnectionEdge[]): Receipt[] {
  const related = getRelatedReceipts(seed.id, receipts, edges);
  const sameDay = receiptsOnDay(receipts, seed.timestamp.slice(0, 10));
  const mixed: Receipt[] = [seed];
  const seen = new Set([seed.id]);
  for (const r of related) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    mixed.push(r);
  }
  for (const r of sameDay) {
    if (seen.has(r.id)) continue;
    if (mixed.some((m) => m.type === r.type) && mixed.length >= 4) continue;
    seen.add(r.id);
    mixed.push(r);
    if (mixed.length >= 6) break;
  }
  return mixed.slice(0, 6).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function pathSpanMinutes(path: Receipt[]): number {
  return spanMinutes(path.map((r) => r.timestamp));
}

/** Heading mood for the moment page — night / morning / day from the seed hour. */
export function timeOfDayMood(iso: string): string {
  const hour = new Date(iso).getHours();
  return hour >= 21 || hour < 5 ? "One ordinary night." : hour < 12 ? "One ordinary morning." : "One ordinary day.";
}
