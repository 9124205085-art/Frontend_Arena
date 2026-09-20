import type { ConnectionEdge, Receipt } from "../data/types";

export type UniversePayload = {
  sample: Receipt[];
  threadPairs: Array<[string, string]>;
};

function takeStride(list: Receipt[], n: number): Receipt[] {
  if (n <= 0 || list.length === 0) return [];
  if (list.length <= n) return list;
  const step = list.length / n;
  const out: Receipt[] = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]!);
  return out;
}

function visualSample(receipts: Receipt[], n: number): Receipt[] {
  const buckets: Record<Receipt["source"], Receipt[]> = { household: [], spotify: [], india: [] };
  for (const r of receipts) buckets[r.source].push(r);
  const sp = Math.min(buckets.spotify.length, Math.floor(n * 0.5));
  const hh = Math.min(buckets.household.length, Math.floor(n * 0.25));
  const ind = Math.min(buckets.india.length, n - sp - hh);
  return [...takeStride(buckets.spotify, sp), ...takeStride(buckets.household, hh), ...takeStride(buckets.india, ind)];
}

/** Tiny visual subset so the 3D scene never holds the full archive. */
export function universePayload(receipts: Receipt[], edges: ConnectionEdge[], mobile: boolean): UniversePayload {
  const sample = visualSample(receipts, mobile ? 28 : 64);
  const ids = new Set(sample.map((r) => r.id));
  const threadPairs: Array<[string, string]> = [];
  for (const e of edges) {
    if (!ids.has(e.a) || !ids.has(e.b)) continue;
    threadPairs.push([e.a, e.b]);
    if (threadPairs.length >= (mobile ? 12 : 24)) break;
  }
  return { sample, threadPairs };
}
