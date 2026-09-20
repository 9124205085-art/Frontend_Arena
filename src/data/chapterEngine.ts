/**
 * Three chapters = the three official archives, described from their own stats.
 */

import type { Chapter, Receipt, StoryVisual } from "./types";

function hour(iso: string): number {
  return new Date(iso).getHours();
}

function span(list: Receipt[]): { start: string; end: string } {
  const sorted = [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { start: sorted[0]?.timestamp ?? "", end: sorted[sorted.length - 1]?.timestamp ?? "" };
}

function tally(list: Receipt[]): string {
  const c = new Map<string, number>();
  for (const r of list) c.set(r.type, (c.get(r.type) ?? 0) + 1);
  return [...c.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, n]) => `${n.toLocaleString("en-IN")} ${t}`)
    .join(", ");
}

function topExtra(list: Receipt[], key: string): string | null {
  const c = new Map<string, number>();
  for (const r of list) {
    const v = String(r.extra?.[key] || "").trim();
    if (v.length < 2) continue;
    c.set(v, (c.get(v) ?? 0) + 1);
  }
  const top = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1].toLocaleString("en-IN")})` : null;
}

function topLocation(list: Receipt[]): string | null {
  const c = new Map<string, number>();
  for (const r of list) {
    const v = (r.location || "").trim();
    if (v.length < 2) continue;
    c.set(v, (c.get(v) ?? 0) + 1);
  }
  const top = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1].toLocaleString("en-IN")} records)` : null;
}

export function assignStory(r: Receipt): StoryVisual {
  if (r.source === "spotify") return "frequency";
  if (r.source === "household") return "ledger";
  return "wander";
}

export function detectChapters(receipts: Receipt[]): Chapter[] {
  const buckets: Record<StoryVisual, Receipt[]> = { frequency: [], ledger: [], wander: [] };
  for (const r of receipts) buckets[assignStory(r)].push(r);

  const frequency = buckets.frequency;
  const ledger = buckets.ledger;
  const wander = buckets.wander;
  const stories: Chapter[] = [];

  if (frequency.length) {
    const night = frequency.filter((r) => hour(r.timestamp) >= 22 || hour(r.timestamp) <= 1).length;
    const artist = topExtra(frequency, "artist");
    const fSpan = span(frequency);
    stories.push({
      id: "story-frequency",
      visual: "frequency",
      title: "The First Frequency",
      kicker: "Spotify archive",
      description: `The dataset contains ${frequency.length.toLocaleString("en-IN")} listening records (${tally(frequency)}). ${Math.round((night / frequency.length) * 100)}% fall between 10 PM and 1 AM.${artist ? ` Most recurrent artist: ${artist}.` : ""} Date range ${fSpan.start.slice(0, 10)} → ${fSpan.end.slice(0, 10)}.`,
      start: fSpan.start,
      end: fSpan.end,
      receiptIds: frequency.slice(0, 12).map((r) => r.id),
      themes: ["nightMusic", "spotify"],
      nightOwlScore: night / frequency.length,
    });
  }

  if (ledger.length) {
    const cat = topExtra(ledger, "category");
    const loc = topLocation(ledger);
    const lSpan = span(ledger);
    stories.push({
      id: "story-ledger",
      visual: "ledger",
      title: "The Household Years",
      kicker: "Daily household transactions",
      description: `${ledger.length.toLocaleString("en-IN")} household rows (${tally(ledger)}).${cat ? ` Dominant category: ${cat}.` : ""}${loc ? ` Most named place token: ${loc}.` : ""} Date range ${lSpan.start.slice(0, 10)} → ${lSpan.end.slice(0, 10)}.`,
      start: lSpan.start,
      end: lSpan.end,
      receiptIds: ledger.slice(0, 12).map((r) => r.id),
      themes: ["home", "ledger"],
      nightOwlScore: 0,
    });
  }

  if (wander.length) {
    const city = topLocation(wander);
    const wSpan = span(wander);
    stories.push({
      id: "story-wander",
      visual: "wander",
      title: "The Wanderer",
      kicker: "India card transactions",
      description: `${wander.length.toLocaleString("en-IN")} card receipts (${tally(wander)}).${city ? ` Most frequent location: ${city}.` : ""} Date range ${wSpan.start.slice(0, 10)} → ${wSpan.end.slice(0, 10)}.`,
      start: wSpan.start,
      end: wSpan.end,
      receiptIds: wander.slice(0, 12).map((r) => r.id),
      themes: ["travel", "india"],
      nightOwlScore: 0,
    });
  }

  return stories;
}
