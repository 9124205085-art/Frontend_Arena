import type { ConnectionEdge, Receipt, ReceiptType } from "../data/types";
import { otherId } from "../data/connectionEngine";
import { detectChapters } from "../data/chapterEngine";
import { TYPE_LABEL } from "./constants";

export function dayStamp(iso: string): string {
  return iso.slice(0, 10);
}

export function hourOf(iso: string): number {
  return new Date(iso).getHours();
}

export function getCategoryStats(receipts: Receipt[]) {
  const counts = new Map<ReceiptType, number>();
  for (const r of receipts) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count, label: TYPE_LABEL[type] }))
    .sort((a, b) => b.count - a.count);
}

export function getHourlyActivity(receipts: Receipt[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const r of receipts) hours[hourOf(r.timestamp)].count += 1;
  return hours;
}

export function getDailyActivity(receipts: Receipt[]) {
  const days = new Map<string, { date: string; count: number; byType: Partial<Record<ReceiptType, number>> }>();
  for (const r of receipts) {
    const d = dayStamp(r.timestamp);
    const cur = days.get(d) ?? { date: d, count: 0, byType: {} };
    cur.count += 1;
    cur.byType[r.type] = (cur.byType[r.type] ?? 0) + 1;
    days.set(d, cur);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getMostActivePeriods(receipts: Receipt[], n = 12) {
  return getDailyActivity(receipts)
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function getLocationStats(receipts: Receipt[]) {
  const map = new Map<string, { location: string; count: number; ids: string[]; byType: Partial<Record<ReceiptType, number>> }>();
  for (const r of receipts) {
    const loc = (r.location || "").trim();
    if (!loc) continue;
    const cur = map.get(loc) ?? { location: loc, count: 0, ids: [], byType: {} };
    cur.count += 1;
    cur.ids.push(r.id);
    cur.byType[r.type] = (cur.byType[r.type] ?? 0) + 1;
    map.set(loc, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getConnections(id: string, edges: ConnectionEdge[]): ConnectionEdge[] {
  return edges.filter((e) => e.a === id || e.b === id);
}

export function getRelatedReceipts(id: string, receipts: Receipt[], edges: ConnectionEdge[]): Receipt[] {
  const ids = getConnections(id, edges).map((e) => otherId(e, id));
  const byId = new Map(receipts.map((r) => [r.id, r]));
  return ids.map((i) => byId.get(i)).filter(Boolean) as Receipt[];
}

export interface Cluster {
  id: string;
  date: string;
  receipts: Receipt[];
  types: ReceiptType[];
}

export function getClusters(receipts: Receipt[], minSize = 3): Cluster[] {
  const groups = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const d = dayStamp(r.timestamp);
    const list = groups.get(d) ?? [];
    list.push(r);
    groups.set(d, list);
  }
  return [...groups.entries()]
    .map(([date, items]) => ({
      id: `day-${date}`,
      date,
      receipts: items.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      types: [...new Set(items.map((i) => i.type))],
    }))
    .filter((c) => c.receipts.length >= minSize)
    .sort((a, b) => b.receipts.length - a.receipts.length);
}

export function getChapters(receipts: Receipt[]) {
  return detectChapters(receipts).map((ch) => {
    const members = receipts.filter((r) => ch.receiptIds.includes(r.id));
    const stats = getCategoryStats(members);
    return {
      ...ch,
      momentCount: members.length,
      dominantType: stats[0]?.type ?? ("note" as ReceiptType),
      dominantLabel: stats[0]?.label ?? "Moments",
    };
  });
}

export interface Pattern {
  id: string;
  icon: string;
  title: string;
  body: string;
  detail: string;
}

export function getPatterns(receipts: Receipt[]): Pattern[] {
  const hours = getHourlyActivity(receipts);
  const peak = hours.slice().sort((a, b) => b.count - a.count)[0];
  const night = hours.filter((h) => h.hour >= 22 || h.hour <= 1).reduce((s, h) => s + h.count, 0);
  const nightPct = receipts.length ? Math.round((night / receipts.length) * 100) : 0;

  const days = getDailyActivity(receipts);
  const musicDays = days.filter((d) => (d.byType.music ?? 0) > 0);
  const musicAndPlace = days.filter((d) => (d.byType.music ?? 0) > 0 && (d.byType.place ?? 0) > 0);
  const photoAndPlace = days.filter((d) => (d.byType.photo ?? 0) > 0 && (d.byType.place ?? 0) > 0);
  const locs = getLocationStats(receipts);
  const eveningPurchases = receipts.filter((r) => r.type === "purchase" && hourOf(r.timestamp) >= 18);
  const events = receipts.filter((r) => r.type === "event");

  const peakLabel = peak
    ? `${((peak.hour + 11) % 12) + 1} ${peak.hour >= 12 ? "PM" : "AM"}`
    : "midnight";

  const patterns: Pattern[] = [
    {
      id: "night-owl",
      icon: "🌙",
      title: "Night Owl",
      body: `${nightPct}% of this archive lands between 10 PM and 1 AM. Peak hour is ${peakLabel}.`,
      detail: `${night} of ${receipts.length} receipts after hours.`,
    },
    {
      id: "music-move",
      icon: "🎵",
      title: "Music & Movement",
      body:
        musicDays.length === 0
          ? "Music lives in its own hours — a private soundtrack."
          : `On ${musicAndPlace.length} days, a song and a place appear together. Music showed up on ${musicDays.length} active days.`,
      detail: "Days where sound and geography share a timestamp.",
    },
    {
      id: "explorer",
      icon: "📍",
      title: "Explorer",
      body: `${locs.length} named places appear in the ledger. ${locs[0] ? `Most recurrent: ${locs[0].location} (${locs[0].count} traces).` : ""}`,
      detail: `${locs.reduce((s, l) => s + l.count, 0)} located receipts.`,
    },
    {
      id: "rituals",
      icon: "☕",
      title: "Small Rituals",
      body: `${eveningPurchases.length} purchases happen after 6 PM${events.length ? `, against ${events.length} marked events` : ""}. Evening still asks to be marked with a cost.`,
      detail: "Spending as punctuation after dark.",
    },
    {
      id: "memory-maker",
      icon: "📷",
      title: "Memory Maker",
      body:
        photoAndPlace.length === 0
          ? "Photos in this archive are rare — the camera is a guest, not a habit."
          : `Photos and places share a day ${photoAndPlace.length} times. A visit often leaves an image.`,
      detail: "Place → shutter, inside thirty minutes of a life.",
    },
  ];

  return patterns;
}

export function getOverview(receipts: Receipt[]) {
  const days = new Set(receipts.map((r) => dayStamp(r.timestamp)));
  const locs = getLocationStats(receipts);
  const hours = getHourlyActivity(receipts);
  const peak = hours.slice().sort((a, b) => b.count - a.count)[0];
  const years = receipts.map((r) => r.timestamp.slice(0, 4)).sort();
  const spanYears =
    years.length > 1 ? Number(years[years.length - 1]) - Number(years[0]) + 1 : 1;
  return {
    total: receipts.length,
    activeDays: days.size,
    places: locs.length,
    categories: getCategoryStats(receipts).length,
    months: Math.max(1, spanYears * 12),
    peakHour: peak?.hour ?? 0,
    peakCount: peak?.count ?? 0,
  };
}

export function searchReceipts(query: string, receipts: Receipt[]): Receipt[] {
  const q = query.trim().toLowerCase();
  if (!q) return receipts;
  const aliases: Record<string, string[]> = {
    "late night": ["nocturnal", "night", "23:", "00:", "01:", "02:"],
    "show me my late nights": ["nocturnal", "night"],
    "find moments connected to music": ["music", "track", "album", "artist"],
    "show my most visited places": ["place", "station", "city", "residence"],
    "where did i spend the most time": ["place", "train", "city"],
  };
  const extra = aliases[q] ?? [];
  return receipts.filter((r) => {
    const blob = `${r.title} ${r.description} ${r.tags.join(" ")} ${r.location || ""} ${r.type} ${r.mood || ""} ${r.timestamp}`.toLowerCase();
    if (blob.includes(q)) return true;
    return extra.some((k) => blob.includes(k));
  });
}
