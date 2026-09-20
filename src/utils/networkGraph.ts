import type { ConnectionEdge, Receipt, ReceiptType } from "../data/types";
import { otherId } from "../data/connectionEngine";
import { hourOf } from "./analyzeData";
import { hashId } from "./format";

export type NetworkMode = "moments" | "places" | "time";
export type HourLens = "all" | "night" | "evening";

export interface GraphFilter {
  types: ReceiptType[];
  presentTypes: ReceiptType[];
  year: number | null;
  month: number | null;
  hourLens: HourLens;
  location: string | null;
  traceIds: string[] | null;
  query: string;
}

function degreeMap(edges: ConnectionEdge[]): Map<string, number> {
  const d = new Map<string, number>();
  for (const e of edges) {
    d.set(e.a, (d.get(e.a) ?? 0) + 1);
    d.set(e.b, (d.get(e.b) ?? 0) + 1);
  }
  return d;
}

function passesLens(r: Receipt, f: GraphFilter): boolean {
  if (f.year && !r.timestamp.startsWith(String(f.year))) return false;
  if (f.month != null && Number(r.timestamp.slice(5, 7)) !== f.month) return false;
  if (f.location && r.location !== f.location) return false;
  if (f.hourLens === "night" && !(hourOf(r.timestamp) >= 22 || hourOf(r.timestamp) <= 1)) return false;
  if (f.hourLens === "evening" && hourOf(r.timestamp) < 18) return false;
  if (f.query) {
    const blob = `${r.title} ${r.description} ${r.tags.join(" ")} ${r.location || ""}`.toLowerCase();
    if (!blob.includes(f.query.toLowerCase())) return false;
  }
  return true;
}

/**
 * Pick a drawable sample of official receipts for React Flow.
 * Highest-degree connected records are seeded first; neighbors stay visible so
 * category filters do not orphan relationships. Default cap is 96 nodes (48 on mobile).
 */
export function pickGraphReceipts(
  receipts: Receipt[],
  edges: ConnectionEdge[],
  f: GraphFilter,
  limit = 96,
): { nodes: Receipt[]; visEdges: ConnectionEdge[]; relatedKeep: Set<string> } {
  const deg = degreeMap(edges);
  const allOn = f.types.length === f.presentTypes.length;
  let pool = receipts.filter((r) => passesLens(r, f));
  if (f.traceIds?.length) {
    const allow = new Set(f.traceIds);
    pool = pool.filter((r) => allow.has(r.id));
  }

  const primary = allOn ? pool : pool.filter((r) => f.types.includes(r.type));
  const ranked = [...primary].sort((a, b) => (deg.get(b.id) ?? 0) - (deg.get(a.id) ?? 0) || a.timestamp.localeCompare(b.timestamp));
  const seed = ranked.slice(0, Math.min(64, limit));
  const keep = new Set(seed.map((r) => r.id));
  const relatedKeep = new Set<string>();

  for (const e of edges) {
    if (keep.has(e.a) && !keep.has(e.b)) relatedKeep.add(e.b);
    if (keep.has(e.b) && !keep.has(e.a)) relatedKeep.add(e.a);
  }

  const byId = new Map(receipts.map((r) => [r.id, r]));
  for (const id of relatedKeep) {
    const r = byId.get(id);
    if (!r || !passesLens(r, { ...f, types: f.presentTypes, traceIds: null })) continue;
    keep.add(id);
    if (keep.size >= limit) break;
  }

  const nodes = [...keep].map((id) => byId.get(id)).filter(Boolean) as Receipt[];
  const ids = new Set(nodes.map((n) => n.id));
  const visEdges = edges.filter((e) => ids.has(e.a) && ids.has(e.b));
  return { nodes, visEdges, relatedKeep };
}

export function layoutMoments(nodes: Receipt[], mode: NetworkMode): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const types = [...new Set(nodes.map((n) => n.type))];
  const sorted = [...nodes].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (mode === "time") {
    sorted.forEach((n, i) => {
      const col = i % 12;
      const row = Math.floor(i / 12);
      const jitter = (hashId(n.id) % 40) - 20;
      map.set(n.id, { x: 80 + col * 160, y: 60 + row * 110 + jitter * 0.3 });
    });
    return map;
  }

  nodes.forEach((n) => {
    const ring = 1 + (types.indexOf(n.type) % 4);
    const a = ((hashId(n.id) % 360) / 360) * Math.PI * 2;
    const radius = 90 + ring * 95 + (hashId(n.id) % 40);
    map.set(n.id, {
      x: 520 + Math.cos(a) * radius,
      y: 340 + Math.sin(a) * radius * 0.78,
    });
  });
  return map;
}

export function layoutPlaces(locations: { location: string; count: number }[]): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  locations.forEach((l, i) => {
    const a = (i / Math.max(1, locations.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = 70 + Math.min(220, l.count * 2);
    map.set(l.location, {
      x: 520 + Math.cos(a) * radius,
      y: 340 + Math.sin(a) * radius * 0.8,
    });
  });
  return map;
}

/**
 * Edges between named places that appear on the same calendar day.
 * Used by Places mode on the Memory Network (not the main relationship engine).
 */
export function placeCooccurrence(
  receipts: Receipt[],
  names: string[],
  max = 36,
): { a: string; b: string; detail: string }[] {
  const allow = new Set(names);
  const byDay = new Map<string, Set<string>>();
  for (const r of receipts) {
    const loc = r.location;
    if (!loc || !allow.has(loc)) continue;
    const d = r.timestamp.slice(0, 10);
    const set = byDay.get(d) ?? new Set();
    set.add(loc);
    byDay.set(d, set);
  }
  const out: { a: string; b: string; detail: string }[] = [];
  const seen = new Set<string>();
  for (const [day, set] of byDay) {
    if (set.size < 2) continue;
    const arr = [...set];
    for (let i = 0; i < arr.length - 1; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a, b, detail: `The dataset shows both locations on ${day}.` });
      if (out.length >= max) return out;
    }
  }
  return out;
}

/**
 * Walk from a selected receipt along its highest-weight edges (default 5 nodes).
 * Used by Follow the story / Tell the story. Path is sorted by timestamp.
 */
export function buildStoryPath(seed: Receipt, receipts: Receipt[], edges: ConnectionEdge[], max = 5): Receipt[] {
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const ordered: Receipt[] = [seed];
  const seen = new Set([seed.id]);
  const queue = edges
    .filter((e) => e.a === seed.id || e.b === seed.id)
    .sort((a, b) => b.weight - a.weight)
    .map((e) => byId.get(otherId(e, seed.id)))
    .filter(Boolean) as Receipt[];

  for (const r of queue.sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    ordered.push(r);
    if (ordered.length >= max) break;
  }
  return ordered.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
