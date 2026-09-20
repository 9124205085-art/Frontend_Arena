/**
 * connectionEngine.ts
 *
 * This is the insight layer — not decoration. Every edge is a reason two
 * disconnected receipts belong to the same moment in a life.
 *
 * Four detectors run over the full set, then we keep the strongest edges
 * so the vine-web in Explore mode stays readable:
 *
 *  a) TEMPORAL     — same calendar day, or within 3 / 7 days
 *  b) LOCATION     — shared place tokens (Place 0, Dadar, a city name…)
 *  c) TAG OVERLAP  — Jaccard similarity of tags / keywords
 *  d) EXPLICIT REF — a note/search/message naming another receipt's
 *                    distinctive title tokens (song, merchant, city, ritual)
 *
 * relatedIds on each receipt is filled from the surviving edges.
 */

import type { ConnectionEdge, ConnectionReason, Receipt } from "./types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "from",
  "with",
  "that",
  "this",
  "untitled",
  "track",
  "receipt",
  "unknown",
  "merchant",
  "via",
  "card",
  "swipe",
  "played",
  "listen",
  "hours",
  "life",
  "later",
  "after",
  "already",
  "gone",
  "quiet",
  "small",
  "amount",
  "still",
  "took",
  "day",
  "house",
  "remembered",
  "journey",
  "ledger",
  "tried",
  "anonymize",
  "subscription",
  "stood",
  "company",
  "screen",
  "billed",
  "entertainment",
  "body",
  "trying",
  "cart",
  "closed",
  "network",
  "fare",
  "toward",
  "somewhere",
  "unnamed",
]);

function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

function toTime(iso: string): number {
  return new Date(iso).getTime();
}

function daysBetween(a: string, b: string): number {
  return Math.abs(toTime(a) - toTime(b)) / 86_400_000;
}

function locKey(receipt: Receipt): string | null {
  const loc = (receipt.location || "").toLowerCase().trim();
  if (loc.length >= 3) return loc;
  const hit = `${receipt.title} ${receipt.description}`.match(
    /(permanent residence|current residence|place [0-9a-z]|dadar|sion|ltt|sevagram|amritsar|mumbai|decathlon)/i,
  );
  return hit ? hit[0].toLowerCase() : null;
}

function distinctiveTokens(receipt: Receipt): Set<string> {
  const bag = new Set<string>();
  const extra = Object.values(receipt.extra || {})
    .map((v) => String(v))
    .join(" ");
  const text = `${receipt.title} ${receipt.tags.join(" ")} ${extra}`;
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 4 || STOP.has(raw) || /^\d+$/.test(raw)) continue;
    bag.add(raw);
  }
  return bag;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function overlapLabels(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const x of a) if (b.has(x)) out.push(x);
  return out.slice(0, 5);
}

function pushEdge(
  bucket: Map<string, ConnectionEdge>,
  a: string,
  b: string,
  reason: ConnectionReason,
  detail: string,
  weight: number,
) {
  if (a === b) return;
  const [left, right] = a < b ? [a, b] : [b, a];
  const key = `${left}|${right}|${reason}`;
  const prev = bucket.get(key);
  if (!prev || weight > prev.weight) {
    bucket.set(key, { a: left, b: right, reason, detail, weight });
  }
}

const MAX_EDGES_PER_NODE = 6;

export function detectConnections(receipts: Receipt[]): ConnectionEdge[] {
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const edges = new Map<string, ConnectionEdge>();
  const tokens = new Map(receipts.map((r) => [r.id, distinctiveTokens(r)]));

  // --- a) close timestamps ---
  const ordered = [...receipts].sort((x, y) => x.timestamp.localeCompare(y.timestamp));
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      const gap = daysBetween(ordered[i].timestamp, ordered[j].timestamp);
      if (gap > 7) break;
      const same = dayStamp(ordered[i].timestamp) === dayStamp(ordered[j].timestamp);
      if (same) {
        pushEdge(
          edges,
          ordered[i].id,
          ordered[j].id,
          "same-day",
          `Both landed on ${dayStamp(ordered[i].timestamp)}`,
          3.4,
        );
      } else if (gap <= 3) {
        pushEdge(
          edges,
          ordered[i].id,
          ordered[j].id,
          "same-week",
          `Only ${gap.toFixed(1)} days apart`,
          2.1,
        );
      } else {
        pushEdge(
          edges,
          ordered[i].id,
          ordered[j].id,
          "same-week",
          `The same week of a life`,
          1.2,
        );
      }
    }
  }

  // --- b) same location ---
  const locGroups = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const key = locKey(r);
    if (!key) continue;
    const list = locGroups.get(key) ?? [];
    list.push(r);
    locGroups.set(key, list);
  }
  for (const [place, group] of locGroups) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        pushEdge(
          edges,
          group[i].id,
          group[j].id,
          "same-location",
          `Both belong to ${place}`,
          2.8,
        );
      }
    }
  }

  // --- c) overlapping tags / keywords ---
  for (let i = 0; i < receipts.length; i++) {
    for (let j = i + 1; j < receipts.length; j++) {
      const A = tokens.get(receipts[i].id)!;
      const B = tokens.get(receipts[j].id)!;
      const sim = jaccard(A, B);
      if (sim < 0.18) continue;
      const shared = overlapLabels(A, B);
      if (!shared.length) continue;
      pushEdge(
        edges,
        receipts[i].id,
        receipts[j].id,
        "shared-tags",
        `Shared ${shared.join(", ")}`,
        1.4 + sim * 3,
      );
    }
  }

  // --- d) explicit references in prose ---
  // A note that says "Sevagram" should lock onto the train receipt titled with it.
  for (const source of receipts) {
    if (!["note", "message", "search", "photo", "event"].includes(source.type)) continue;
    const hay = `${source.title} ${source.description} ${(source.extra?.mentions as string) || ""}`.toLowerCase();
    for (const target of receipts) {
      if (target.id === source.id) continue;
      const needles = [
        target.title,
        String(target.extra?.artist || ""),
        String(target.extra?.merchant || ""),
        target.location || "",
      ]
        .map((s) => s.trim())
        .filter((s) => s.length >= 4);

      for (const needle of needles) {
        const n = needle.toLowerCase();
        if (n.length < 4 || STOP.has(n)) continue;
        if (hay.includes(n)) {
          pushEdge(
            edges,
            source.id,
            target.id,
            "explicit-mention",
            `“${source.title}” names ${needle}`,
            4.2,
          );
          break;
        }
      }
    }
  }

  // Keep the strongest vines per leaf so Explore mode does not become a thicket.
  const ranked = [...edges.values()].sort((a, b) => b.weight - a.weight);
  const used = new Map<string, number>();
  const kept: ConnectionEdge[] = [];
  for (const edge of ranked) {
    const ca = used.get(edge.a) ?? 0;
    const cb = used.get(edge.b) ?? 0;
    if (ca >= MAX_EDGES_PER_NODE && cb >= MAX_EDGES_PER_NODE) continue;
    if (ca >= MAX_EDGES_PER_NODE + 2 || cb >= MAX_EDGES_PER_NODE + 2) continue;
    kept.push(edge);
    used.set(edge.a, ca + 1);
    used.set(edge.b, cb + 1);
  }

  for (const r of receipts) r.relatedIds = [];
  for (const edge of kept) {
    byId.get(edge.a)?.relatedIds.push(edge.b);
    byId.get(edge.b)?.relatedIds.push(edge.a);
  }

  return kept;
}

export function edgesFor(id: string, edges: ConnectionEdge[]): ConnectionEdge[] {
  return edges.filter((e) => e.a === id || e.b === id);
}

export function otherId(edge: ConnectionEdge, id: string): string {
  return edge.a === id ? edge.b : edge.a;
}
