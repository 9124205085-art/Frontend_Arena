import type { ConnectionEdge, Receipt, ReceiptType } from "../data/types";
import { assignStory, detectChapters } from "../data/chapterEngine";
import { otherId } from "../data/connectionEngine";
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
    if (cur.ids.length < 24) cur.ids.push(r.id);
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
  total: number;
}

export function getClusters(receipts: Receipt[], minSize = 3, limit = 24): Cluster[] {
  const groups = new Map<string, Receipt[]>();
  for (const r of receipts) {
    const d = dayStamp(r.timestamp);
    const list = groups.get(d);
    if (list) list.push(r);
    else groups.set(d, [r]);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length >= minSize)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([date, items]) => {
      const ordered = items.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const mixed: Receipt[] = [];
      const seen = new Set<ReceiptType>();
      for (const r of ordered) {
        if (!seen.has(r.type)) {
          seen.add(r.type);
          mixed.push(r);
        }
      }
      const rest = ordered.filter((r) => !mixed.includes(r));
      return {
        id: `day-${date}`,
        date,
        receipts: [...mixed, ...rest].slice(0, 40),
        types: [...new Set(items.map((i) => i.type))],
        total: items.length,
      };
    });
}

export function receiptsOnDay(receipts: Receipt[], date: string): Receipt[] {
  return receipts.filter((r) => dayStamp(r.timestamp) === date).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getChapters(receipts: Receipt[]) {
  return detectChapters(receipts).map((ch) => {
    const members = receipts.filter((r) => assignStory(r) === ch.visual);
    const stats = getCategoryStats(members);
    return {
      ...ch,
      momentCount: members.length,
      dominantType: stats[0]?.type ?? ("purchase" as ReceiptType),
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

function topCount(map: Map<string, number>): [string, number] | null {
  const top = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ?? null;
}

export function getPatterns(receipts: Receipt[]): Pattern[] {
  if (!receipts.length) return [];
  const hours = getHourlyActivity(receipts);
  const peak = hours.slice().sort((a, b) => b.count - a.count)[0];
  const night = hours.filter((h) => h.hour >= 22 || h.hour <= 1).reduce((s, h) => s + h.count, 0);
  const nightPct = Math.round((night / receipts.length) * 100);

  const days = getDailyActivity(receipts);
  const musicDays = days.filter((d) => (d.byType.music ?? 0) > 0);
  const musicAndPlace = days.filter((d) => (d.byType.music ?? 0) > 0 && (d.byType.place ?? 0) > 0);
  const locs = getLocationStats(receipts);
  const eveningPurchases = receipts.filter((r) => r.type === "purchase" && hourOf(r.timestamp) >= 18);
  const events = receipts.filter((r) => r.type === "event");
  const skipped = receipts.filter((r) => r.type === "music" && r.extra?.skipped === true).length;
  const music = receipts.filter((r) => r.type === "music").length;

  const artists = new Map<string, number>();
  const hhCats = new Map<string, number>();
  for (const r of receipts) {
    const artist = String(r.extra?.artist || "").trim();
    if (artist) artists.set(artist, (artists.get(artist) ?? 0) + 1);
    if (r.source === "household") {
      const cat = String(r.extra?.category || "").trim();
      if (cat) hhCats.set(cat, (hhCats.get(cat) ?? 0) + 1);
    }
  }
  const topArtist = topCount(artists);
  const topCat = topCount(hhCats);

  const peakLabel = peak
    ? `${((peak.hour + 11) % 12) + 1} ${peak.hour >= 12 ? "PM" : "AM"}`
    : "midnight";

  const patterns: Pattern[] = [
    {
      id: "night-owl",
      icon: "🌙",
      title: "Night Owl",
      body: `The dataset shows ${nightPct}% of records between 10 PM and 1 AM. Peak hour is ${peakLabel} (${peak?.count.toLocaleString("en-IN")} records).`,
      detail: `${night.toLocaleString("en-IN")} of ${receipts.length.toLocaleString("en-IN")} receipts in that window.`,
    },
  ];

  if (musicAndPlace.length > 0) {
    patterns.push({
      id: "music-move",
      icon: "🎵",
      title: "Music & Movement",
      body: `On ${musicAndPlace.length.toLocaleString("en-IN")} days, a music record and a place record share a date. Music appears on ${musicDays.length.toLocaleString("en-IN")} active days.`,
      detail: "Counted from same-day co-occurrence in the archive.",
    });
  } else if (musicDays.length > 0) {
    patterns.push({
      id: "music-move",
      icon: "🎵",
      title: "Music, mostly alone",
      body: `Music appears on ${musicDays.length.toLocaleString("en-IN")} days. The dataset does not show place records on those same dates.`,
      detail: "No same-day music + place overlap was found.",
    });
  }

  if (locs.length > 0) {
    patterns.push({
      id: "explorer",
      icon: "📍",
      title: "Explorer",
      body: `${locs.length.toLocaleString("en-IN")} distinct locations appear in the records. Most recurrent: ${locs[0].location} (${locs[0].count.toLocaleString("en-IN")} traces).`,
      detail: `${locs.reduce((s, l) => s + l.count, 0).toLocaleString("en-IN")} located receipts.`,
    });
  }

  if (eveningPurchases.length > 0) {
    patterns.push({
      id: "rituals",
      icon: "☕",
      title: "After-hours spending",
      body: `${eveningPurchases.length.toLocaleString("en-IN")} purchases are timestamped after 6 PM${events.length ? `, and the archive also contains ${events.length.toLocaleString("en-IN")} event receipts` : ""}.`,
      detail: "Hour filter applied to purchase records only.",
    });
  }

  if (topArtist) {
    patterns.push({
      id: "repeat-artist",
      icon: "🎵",
      title: "Repeated listening",
      body: `The Spotify archive names ${topArtist[0]} most often — ${topArtist[1].toLocaleString("en-IN")} plays.`,
      detail: `Counted from the artist_name field. ${skipped.toLocaleString("en-IN")} of ${music.toLocaleString("en-IN")} plays are marked skipped.`,
    });
  }

  if (topCat) {
    patterns.push({
      id: "household-mix",
      icon: "🧾",
      title: "Household mix",
      body: `In the household ledger, ${topCat[0]} is the most common category (${topCat[1].toLocaleString("en-IN")} rows).`,
      detail: "Counted from the Category field in Daily Household Transactions.",
    });
  }

  return patterns;
}

export function getOverview(receipts: Receipt[]) {
  const days = new Set(receipts.map((r) => dayStamp(r.timestamp)));
  const months = new Set(receipts.map((r) => r.timestamp.slice(0, 7)));
  const locs = getLocationStats(receipts);
  const hours = getHourlyActivity(receipts);
  const peak = hours.slice().sort((a, b) => b.count - a.count)[0];
  const cats = getCategoryStats(receipts);
  return {
    total: receipts.length,
    activeDays: days.size,
    places: locs.length,
    categories: cats.length,
    months: months.size,
    peakHour: peak?.hour ?? 0,
    peakCount: peak?.count ?? 0,
    topCategory: cats[0]?.label ?? "—",
  };
}

export function searchReceipts(query: string, receipts: Receipt[]): Receipt[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const aliases: Record<string, string[]> = {
    "late night": ["nocturnal"],
    "show me my late nights": ["nocturnal"],
    "find moments connected to music": ["music"],
    "show my most visited places": ["place"],
    "where did i spend the most time": ["place"],
  };
  const extra = aliases[q] ?? [];
  const nightHours = q.includes("late night") || q.includes("late nights");
  return receipts.filter((r) => {
    if (nightHours && (hourOf(r.timestamp) >= 22 || hourOf(r.timestamp) <= 1)) return true;
    const blob =
      `${r.title} ${r.description} ${r.tags.join(" ")} ${r.location || ""} ${r.type} ${r.mood || ""} ${r.timestamp} ${r.extra?.artist || ""} ${r.extra?.merchant || ""} ${r.extra?.person || ""} ${r.extra?.category || ""} ${r.source}`.toLowerCase();
    if (blob.includes(q)) return true;
    return extra.some((k) => blob.includes(k));
  });
}
