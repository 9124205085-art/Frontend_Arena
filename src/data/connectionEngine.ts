/**
 * Connection discovery from actual records only.
 * Every edge stores why two receipts are linked.
 *
 * Rules (no random edges):
 *  1. Temporal proximity (minutes/hours apart)
 *  2. Same calendar day, different category/source
 *  3. Same location
 *  4. Same entity (artist, merchant, person)
 *  5. Shared rare keywords from real fields
 *
 * Pairwise Jaccard across 160k rows is skipped on purpose.
 */

import type { ConnectionEdge, ConnectionReason, Receipt } from "./types";

function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

function toTime(iso: string): number {
  return new Date(iso).getTime();
}

function minutesBetween(a: string, b: string): number {
  return Math.abs(toTime(a) - toTime(b)) / 60_000;
}

function locKey(receipt: Receipt): string | null {
  const loc = (receipt.location || "").toLowerCase().trim();
  return loc.length >= 3 ? loc : null;
}

function entityKey(receipt: Receipt): string | null {
  const artist = String(receipt.extra?.artist || "").trim().toLowerCase();
  if (artist.length >= 3) return `artist:${artist}`;
  const person = String(receipt.extra?.person || "").trim().toLowerCase();
  if (person.length >= 4) return `person:${person}`;
  const merchant = String(receipt.extra?.merchant || receipt.title || "")
    .replace(/^fraud_/i, "")
    .trim()
    .toLowerCase();
  if (receipt.source === "india" && merchant.length >= 4) return `merchant:${merchant}`;
  return null;
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

const MAX_EDGES_PER_NODE = 8;
const MAX_EDGES = 10_000;

export function detectConnections(receipts: Receipt[]): ConnectionEdge[] {
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const edges = new Map<string, ConnectionEdge>();
  const ordered = [...receipts].sort((x, y) => x.timestamp.localeCompare(y.timestamp));

  // 1. Temporal proximity — look ahead until the gap exceeds 90 minutes.
  for (let i = 0; i < ordered.length; i++) {
    let added = 0;
    for (let j = i + 1; j < ordered.length && added < 3; j++) {
      const mins = minutesBetween(ordered[i].timestamp, ordered[j].timestamp);
      if (mins > 90) break;
      if (mins > 45 && ordered[i].source === ordered[j].source && ordered[i].type === ordered[j].type) continue;
      const label =
        mins < 1
          ? "These records occurred less than a minute apart."
          : `These moments occurred ${Math.round(mins)} minutes apart.`;
      pushEdge(edges, ordered[i].id, ordered[j].id, "temporal", label, mins <= 15 ? 4.2 : 3.1);
      added += 1;
    }
  }

  // 2. Same day, mixed category/source — a real "moment" candidate.
  const byDay = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const d = dayStamp(r.timestamp);
    const list = byDay.get(d);
    if (list) list.push(r);
    else byDay.set(d, [r]);
  }
  for (const [date, group] of byDay) {
    const mixed: Receipt[] = [];
    const seen = new Set<string>();
    const sorted = [...group].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (const r of sorted) {
      const key = `${r.type}:${r.source}`;
      if (seen.has(key) && mixed.length >= 6) continue;
      if (!seen.has(key)) {
        seen.add(key);
        mixed.push(r);
      }
    }
    if (seen.size < 2) continue;
    for (let i = 0; i < mixed.length - 1; i++) {
      pushEdge(
        edges,
        mixed[i].id,
        mixed[i + 1].id,
        "same-day",
        `The dataset shows both on ${date}, across ${mixed[i].type} and ${mixed[i + 1].type}.`,
        3.6,
      );
    }
  }

  // 3. Same location — sequential in time, capped.
  const locGroups = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const key = locKey(r);
    if (!key) continue;
    const list = locGroups.get(key);
    if (list) list.push(r);
    else locGroups.set(key, [r]);
  }
  for (const [place, group] of locGroups) {
    if (group.length < 2) continue;
    const seq = [...group].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let added = 0;
    for (let i = 0; i < seq.length - 1 && added < 48; i++) {
      pushEdge(
        edges,
        seq[i].id,
        seq[i + 1].id,
        "same-location",
        `Both moments occurred at ${place}.`,
        2.8,
      );
      added += 1;
    }
  }

  // 4. Same entity (artist / person / merchant) — nearby in time only.
  const entGroups = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const key = entityKey(r);
    if (!key) continue;
    const list = entGroups.get(key);
    if (list) list.push(r);
    else entGroups.set(key, [r]);
  }
  for (const [key, group] of entGroups) {
    if (group.length < 2) continue;
    const label = key.slice(key.indexOf(":") + 1);
    const seq = [...group].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let added = 0;
    for (let i = 0; i < seq.length - 1 && added < 36; i++) {
      const mins = minutesBetween(seq[i].timestamp, seq[i + 1].timestamp);
      if (mins > 48 * 60) continue;
      pushEdge(
        edges,
        seq[i].id,
        seq[i + 1].id,
        "same-entity",
        `Repeated entity in the dataset: ${label}.`,
        2.4,
      );
      added += 1;
    }
  }

  // 5. Rare shared keywords from real tags (not generic "music").
  const invert = new Map<string, string[]>();
  for (const r of receipts) {
    for (const tag of r.tags) {
      if (tag.length < 4) continue;
      if (tag === "music" || tag === "purchase" || tag === "place" || tag === "movie" || tag === "event") continue;
      const list = invert.get(tag);
      if (list) {
        if (list.length < 60) list.push(r.id);
      } else invert.set(tag, [r.id]);
    }
  }
  for (const [tag, ids] of invert) {
    if (ids.length < 2 || ids.length > 40) continue;
    for (let i = 0; i < ids.length - 1; i++) {
      pushEdge(edges, ids[i], ids[i + 1], "shared-tags", `Shared keyword from the records: ${tag}.`, 1.6);
    }
  }

  const ranked = [...edges.values()].sort((a, b) => b.weight - a.weight).slice(0, MAX_EDGES);
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

export function getConnectionReason(edge: ConnectionEdge): string {
  return edge.detail;
}

export function edgesFor(id: string, edges: ConnectionEdge[]): ConnectionEdge[] {
  return edges.filter((e) => e.a === id || e.b === id);
}

export function otherId(edge: ConnectionEdge, id: string): string {
  return edge.a === id ? edge.b : edge.a;
}
