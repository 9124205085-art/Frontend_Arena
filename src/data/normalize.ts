/**
 * Normalization layer: official CSV rows → Receipt.
 * Does not invent records. Rows without a parseable timestamp are skipped.
 */

import type { HouseholdRow, IndiaRow, Receipt, ReceiptType, SpotifyRow } from "./types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "from",
  "with",
  "that",
  "this",
  "was",
  "were",
  "have",
  "has",
  "had",
  "not",
  "but",
  "you",
  "your",
  "are",
  "its",
  "into",
]);

export function slug(parts: Array<string | number | undefined>): string {
  return parts
    .map((p) => String(p ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    .filter(Boolean)
    .join("-")
    .slice(0, 96);
}

function matchDate(v: string, re: RegExp, dayFirst: boolean): Date | null {
  const m = v.match(re);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const y = Number(m[3]);
  const hh = Number(m[4] ?? 12);
  const mm = Number(m[5] ?? 0);
  const ss = Number(m[6] ?? 0);
  const day = dayFirst ? a : b;
  const month = dayFirst ? b : a;
  if (!y || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(y, month - 1, day, hh, mm, ss);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseHouseholdDate(raw: string): Date | null {
  return matchDate(raw.trim(), /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, true);
}

export function parseSpotifyDate(raw: string): Date | null {
  const d = new Date(raw.trim().replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseIndiaDate(raw: string): Date | null {
  return matchDate(raw.trim(), /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, false);
}

export function toIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function tokens(...chunks: string[]): string[] {
  const found = new Set<string>();
  for (const chunk of chunks) {
    for (const raw of chunk.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3 || STOP.has(raw)) continue;
      found.add(raw);
    }
  }
  return [...found].slice(0, 10);
}

function hourMood(date: Date): string | undefined {
  const h = date.getHours();
  if (h <= 4 || h >= 22) return "nocturnal";
  return undefined;
}

function householdType(row: HouseholdRow): ReceiptType {
  const cat = (row.Category || "").toLowerCase();
  const sub = (row.Subcategory || "").toLowerCase();
  const note = (row.Note || "").toLowerCase();
  const blob = `${cat} ${sub} ${note}`;
  if (cat === "festivals" || cat === "gift" || cat === "culture" || cat === "social life") return "event";
  if (cat === "transportation" || cat === "tourism") return "place";
  if (cat === "subscription" && /netflix|prime|hotstar|sonyliv|zee5/.test(blob)) return "movie";
  return "purchase";
}

const PLACE_RE =
  /(permanent residence|current residence|place [0-9a-z]+|dadar|sion|ltt|vadala|sevagram|amritsar|patna|decathlon|workplace)/i;

export function extractHouseholdLocation(text: string): string | undefined {
  const named = text.match(PLACE_RE);
  return named?.[0];
}

export function fromHousehold(row: HouseholdRow, index: number): Receipt | null {
  const date = parseHouseholdDate(row.Date);
  if (!date) return null;
  const type = householdType(row);
  const note = (row.Note || "").trim();
  const cat = (row.Category || "").trim();
  const sub = (row.Subcategory || "").trim();
  const amount = Number(row.Amount);
  const title = note || [sub, cat].filter(Boolean).join(" · ") || "Household transaction";
  const location = extractHouseholdLocation(`${note} ${cat} ${sub}`);
  const facts = [
    cat && sub ? `${cat} / ${sub}.` : cat ? `${cat}.` : "",
    note && note !== title ? `Note: ${note}.` : "",
    Number.isFinite(amount)
      ? `₹${amount.toLocaleString("en-IN")} via ${row.Mode || "unspecified"} (${row["Income/Expense"] || "Expense"}).`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: slug(["hh", index, row.Date, cat, note]),
    type,
    timestamp: toIso(date),
    title,
    description: facts,
    location,
    tags: tokens(cat, sub, note, type, location || ""),
    mood: hourMood(date),
    relatedIds: [],
    amount: Number.isFinite(amount) ? amount : undefined,
    currency: row.Currency || "INR",
    source: "household",
    extra: {
      mode: row.Mode,
      category: cat,
      subcategory: sub,
      incomeExpense: row["Income/Expense"],
    },
  };
}

export function fromSpotify(row: SpotifyRow, index: number): Receipt | null {
  const date = parseSpotifyDate(row.ts);
  if (!date) return null;
  const ms = Number(row.ms_played) || 0;
  const minutes = Math.max(0, Math.round(ms / 60000));
  const skipped = String(row.skipped).toUpperCase() === "TRUE";
  const artist = (row.artist_name || "").trim();
  const album = (row.album_name || "").trim();
  const track = (row.track_name || "").trim() || "Untitled track";

  return {
    id: slug(["sp", index, row.ts, row.spotify_track_uri || track]),
    type: "music",
    timestamp: toIso(date),
    title: track,
    description: [
      [artist, album].filter(Boolean).join(" — "),
      `${minutes} min on ${row.platform || "unknown"}`,
      skipped ? "skipped" : "",
      row.reason_start ? `started: ${row.reason_start}` : "",
    ]
      .filter(Boolean)
      .join(". "),
    tags: tokens(track, artist, album, "music"),
    mood: hourMood(date),
    relatedIds: [],
    source: "spotify",
    extra: {
      artist,
      album,
      platform: row.platform,
      ms_played: ms,
      skipped,
      uri: row.spotify_track_uri,
    },
  };
}

function cleanMerchant(raw: string): string {
  return raw.replace(/^fraud_/i, "").replace(/\s+Pvt Ltd$/i, "").trim();
}

export function fromIndia(row: IndiaRow, index: number): Receipt | null {
  const date = parseIndiaDate(row.trans_date_trans_time);
  if (!date) return null;
  const cat = (row.category || "").toLowerCase().trim();
  const type: ReceiptType =
    cat === "travel" ? "place" : cat === "entertainment" ? "movie" : cat === "fitness_and_medical" ? "event" : "purchase";
  const merchant = cleanMerchant(row.merchant || "") || "Unnamed merchant";
  const amt = Number(row.amt);
  const city = (row.city || "").trim();
  const state = (row.state || "").trim();
  const location = [city, state].filter(Boolean).join(", ") || undefined;
  const person = [row.first, row.last].filter(Boolean).join(" ").trim();

  return {
    id: slug(["in", index, row.trans_id, row.trans_date_trans_time]),
    type,
    timestamp: toIso(date),
    title: merchant,
    description: [
      cat ? cat.replace(/_/g, " ") : "uncategorized transaction",
      Number.isFinite(amt) ? `₹${amt.toLocaleString("en-IN")}` : "",
      location,
      person ? `cardholder: ${person}` : "",
      row.job ? `job: ${row.job}` : "",
    ]
      .filter(Boolean)
      .join(". "),
    location,
    tags: tokens(cat, merchant, city, state, type, person),
    mood: hourMood(date),
    relatedIds: [],
    amount: Number.isFinite(amt) ? amt : undefined,
    currency: "INR",
    source: "india",
    extra: {
      merchant: row.merchant || "",
      category: row.category || "",
      city,
      state,
      job: row.job || "",
      person,
      trans_id: row.trans_id || "",
    },
  };
}
