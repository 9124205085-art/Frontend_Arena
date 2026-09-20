/**
 * chapterEngine.ts
 *
 * The archive is three datasets. We do not slice by calendar month.
 * We tell three stories — each one a whole website with its own theme:
 *
 *  1. FREQUENCY  — Spotify. The night-owl listening life.
 *  2. LEDGER     — Household transactions. Commute, kitchen, festivals.
 *  3. WANDER     — India card swipes. Cities after the ledger went quiet.
 *
 * Derived notes/photos/searches are assigned by what they mention,
 * then by year, so they stitch the three lives together.
 */

import type { Chapter, Receipt, StoryVisual } from "./types";

function hour(iso: string): number {
  return new Date(iso).getHours();
}

function blobOf(r: Receipt): string {
  return `${r.title} ${r.description} ${r.tags.join(" ")} ${r.location || ""} ${(r.extra?.mentions as string) || ""}`.toLowerCase();
}

export function assignStory(r: Receipt): StoryVisual {
  if (r.source === "spotify") return "frequency";
  if (r.source === "household") return "ledger";
  if (r.source === "india") return "wander";

  const blob = blobOf(r);
  if (
    r.type === "music" ||
    /lana|beatles|killers|mayer|album|track|weezer|howard shore|radiohead|dylan|playlist|midnight|2 am|nocturnal/.test(blob)
  ) {
    return "frequency";
  }
  if (
    /ganesh|navratri|diwali|train|sevagram|dadar|sion|ltt|place 0|cataract|domino|residence|ledger|kirana|farewell/.test(blob)
  ) {
    return "ledger";
  }
  if (/travel|city|station food|fitness|entertainment|merchant|window,/.test(blob)) {
    return "wander";
  }

  const y = Number(r.timestamp.slice(0, 4));
  if (y >= 2022) return "wander";
  if (y >= 2015 && y <= 2018) return "ledger";
  return "frequency";
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
    .map(([t, n]) => `${n} ${t}${n > 1 ? "s" : ""}`)
    .join(", ");
}

export function detectChapters(receipts: Receipt[]): Chapter[] {
  const buckets: Record<StoryVisual, Receipt[]> = {
    frequency: [],
    ledger: [],
    wander: [],
  };
  for (const r of receipts) buckets[assignStory(r)].push(r);

  const frequency = buckets.frequency.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const ledger = buckets.ledger.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const wander = buckets.wander.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const nightMusic = frequency.filter((r) => r.type === "music" && (hour(r.timestamp) <= 4 || hour(r.timestamp) >= 23));
  const musicN = frequency.filter((r) => r.type === "music").length;

  const fSpan = span(frequency);
  const lSpan = span(ledger);
  const wSpan = span(wander);

  const stories: Chapter[] = [
    {
      id: "story-frequency",
      visual: "frequency",
      title: "The First Frequency",
      kicker: "The beginning",
      description: `The archive wakes at 2 AM. ${frequency.length} receipts — ${tally(frequency)}. ${
        musicN ? `${nightMusic.length} of the tracks happen after the city clocks out.` : "Mostly sound, almost no household."
      } A person who was most themselves when nobody was asking for anything.`,
      start: fSpan.start,
      end: fSpan.end,
      receiptIds: frequency.map((r) => r.id),
      themes: ["nightMusic", "solitude", "entertainment"],
      nightOwlScore: musicN ? nightMusic.length / musicN : 0,
    },
    {
      id: "story-ledger",
      visual: "ledger",
      title: "The Household Years",
      kicker: "Home, trains, festivals",
      description: `${ledger.length} lines in a household book — ${tally(ledger)}. Place 0 is not a place; it is a habit. Ganesh idols, 3AC berths, a farewell, a pair of glasses. The ledger stops in 2018. The person does not.`,
      start: lSpan.start,
      end: lSpan.end,
      receiptIds: ledger.map((r) => r.id),
      themes: ["home", "commute", "festival"],
      nightOwlScore: 0,
    },
    {
      id: "story-wander",
      visual: "wander",
      title: "The Wanderer",
      kicker: "Cities the locals never reached",
      description: `${wander.length} later-life swipes — ${tally(wander)}. After the household rows go quiet, the card starts naming cities. Entertainment halls, late-night food near stations, a body still trying in places that are not home.`,
      start: wSpan.start,
      end: wSpan.end,
      receiptIds: wander.map((r) => r.id),
      themes: ["travel", "entertainment", "solitude"],
      nightOwlScore: 0,
    },
  ];

  return stories.filter((s) => s.receiptIds.length > 0);
}
