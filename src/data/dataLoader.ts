/**
 * dataLoader.ts
 *
 * Reads the curated bundle (sampled from the three archives) and maps
 * each source's ORIGINAL field names onto a shared Receipt shape.
 *
 * Household CSV: Date, Mode, Category, Subcategory, Note, Amount, Income/Expense, Currency
 * Spotify CSV:   spotify_track_uri, ts, platform, ms_played, track_name, artist_name, album_name, ...
 * India CSV:     trans_id, trans_date_trans_time, merchant, category, amt, city, state, ...
 * Derived:       inferred photos / messages / searches / notes / events / movies
 *                that name-check real rows so the connection engine can stitch them.
 */

import type {
  DataBundle,
  DerivedRow,
  HouseholdRow,
  IndiaRow,
  Receipt,
  ReceiptType,
  SpotifyRow,
} from "./types";

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
  "onto",
  "over",
  "near",
  "after",
  "before",
]);

function slug(parts: Array<string | number | undefined>): string {
  return parts
    .map((p) => String(p ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    .filter(Boolean)
    .join("-")
    .slice(0, 80);
}

function parseHouseholdDate(raw: string): Date | null {
  const s = raw.trim();
  const formats: Array<(v: string) => Date | null> = [
    (v) => matchDate(v, /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, true),
  ];
  for (const f of formats) {
    const d = f(s);
    if (d && !Number.isNaN(d.getTime())) return d;
  }
  return null;
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
  return new Date(y, month - 1, day, hh, mm, ss);
}

function parseSpotifyDate(raw: string): Date | null {
  const d = new Date(raw.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIndiaDate(raw: string): Date | null {
  return matchDate(
    raw.trim(),
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    false,
  );
}

function toIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function tokens(...chunks: string[]): string[] {
  const found = new Set<string>();
  for (const chunk of chunks) {
    for (const raw of chunk.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3 || STOP.has(raw)) continue;
      found.add(raw);
    }
  }
  return [...found].slice(0, 12);
}

function hourMood(date: Date, fallback = "neutral"): string {
  const h = date.getHours();
  if (h <= 4 || h >= 23) return "nocturnal";
  if (h <= 8) return "early";
  if (h >= 20) return "dusk";
  return fallback;
}

function householdType(row: HouseholdRow): ReceiptType {
  const cat = (row.Category || "").toLowerCase();
  const sub = (row.Subcategory || "").toLowerCase();
  const note = (row.Note || "").toLowerCase();
  const blob = `${cat} ${sub} ${note}`;

  if (cat === "festivals" || /ganesh|navratri|holi|diwali|raksha|bhaiduj/.test(blob)) {
    return "event";
  }
  if (cat === "transportation" || /train|auto|taxi|bus|station|place \d/.test(blob)) {
    return "place";
  }
  if (/netflix|prime|audible/.test(blob)) return "movie";
  if (cat === "gift" || /farewell/.test(blob)) return "event";
  return "purchase";
}

function extractLocation(text: string): string | undefined {
  const named = text.match(
    /(Permanent Residence|Current Residence|Place [0-9A-Z]|Dadar|Sion|LTT|Decathlon|Vadala|Sevagram|Amritsar|Patna)/i,
  );
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
  const title =
    note ||
    [sub, cat].filter(Boolean).join(" · ") ||
    "Household receipt";

  const location = extractLocation(`${note} ${cat} ${sub}`);
  const kindLabel =
    type === "place"
      ? "A journey the ledger tried to anonymize."
      : type === "event"
        ? "A day the house remembered."
        : type === "movie"
          ? "A subscription that stood in for company."
          : "A small amount that still took a day with it.";

  return {
    id: slug(["hh", row.Date, cat, sub, note, index]),
    type,
    timestamp: toIso(date),
    title,
    description: [
      kindLabel,
      sub && cat ? `${cat} / ${sub}.` : cat ? `${cat}.` : "",
      note && note !== title ? `Noted as: ${note}.` : "",
      Number.isFinite(amount)
        ? `₹${amount.toLocaleString("en-IN")} via ${row.Mode || "unknown"}, ${row["Income/Expense"] || "Expense"}.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    location,
    tags: tokens(cat, sub, note, type, location || ""),
    mood: hourMood(date, type === "event" ? "warm" : "ordinary"),
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
  const minutes = Math.max(1, Math.round(ms / 60000));
  const skipped = String(row.skipped).toUpperCase() === "TRUE";
  const night = date.getHours() <= 4 || date.getHours() >= 23;

  return {
    id: slug(["sp", row.ts, row.track_name, index]),
    type: "music",
    timestamp: toIso(date),
    title: row.track_name || "Untitled track",
    description: [
      night
        ? `Played in the hours that do not belong to anyone else.`
        : `A listen that lasted.`,
      `${row.artist_name} — ${row.album_name}.`,
      `${minutes} min on ${row.platform || "unknown"}${skipped ? ", then skipped." : "."}`,
    ].join(" "),
    tags: tokens(row.track_name, row.artist_name, row.album_name, "music", night ? "night" : "day"),
    mood: night ? "nocturnal" : skipped ? "restless" : "attuned",
    relatedIds: [],
    source: "spotify",
    extra: {
      artist: row.artist_name,
      album: row.album_name,
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
  const cat = (row.category || "").toLowerCase();
  const type: ReceiptType =
    cat === "travel"
      ? "place"
      : cat === "entertainment"
        ? "movie"
        : cat === "fitness_and_medical"
          ? "event"
          : "purchase";
  const merchant = cleanMerchant(row.merchant || "Unknown merchant");
  const amt = Number(row.amt);
  const city = (row.city || "").trim();
  const state = (row.state || "").trim();
  const location = [city, state].filter(Boolean).join(", ");

  const titles: Record<ReceiptType, string> = {
    place: `A fare toward ${city || "somewhere unnamed"}`,
    movie: `A screen, billed as entertainment`,
    event: `The body, trying, in ${city || "transit"}`,
    purchase: `A cart that closed in ${city || "the network"}`,
    music: merchant,
    photo: merchant,
    message: merchant,
    search: merchant,
    note: merchant,
  };

  return {
    id: slug(["in", row.trans_id, row.trans_date_trans_time, index]),
    type,
    timestamp: toIso(date),
    title: titles[type],
    description: [
      `${merchant}.`,
      cat.replace(/_/g, " ") + ".",
      Number.isFinite(amt) ? `Card swipe ₹${amt.toLocaleString("en-IN")}.` : "",
      location ? `${location}.` : "",
      "A later-life receipt — after the household ledger had already gone quiet.",
    ]
      .filter(Boolean)
      .join(" "),
    location: location || undefined,
    tags: tokens(cat, merchant, city, state, type, "travel"),
    mood: type === "place" ? "wandering" : type === "movie" ? "hushed" : "restless",
    relatedIds: [],
    amount: Number.isFinite(amt) ? amt : undefined,
    currency: "INR",
    source: "india",
    extra: {
      merchant: row.merchant,
      category: row.category,
      city,
      state,
      job: row.job || "",
    },
  };
}

export function fromDerived(row: DerivedRow): Receipt {
  return {
    id: row.id,
    type: row.kind,
    timestamp: row.timestamp,
    title: row.title,
    description: row.body,
    location: row.location,
    tags: row.tags ?? [],
    mood: row.mood,
    relatedIds: [],
    source: "derived",
    extra: {
      mentions: (row.mentions || []).join(", "),
    },
  };
}

export function normalizeBundle(bundle: DataBundle): Receipt[] {
  const receipts: Receipt[] = [];
  bundle.household.forEach((row, i) => {
    const r = fromHousehold(row, i);
    if (r) receipts.push(r);
  });
  bundle.spotify.forEach((row, i) => {
    const r = fromSpotify(row, i);
    if (r) receipts.push(r);
  });
  bundle.india.forEach((row, i) => {
    const r = fromIndia(row, i);
    if (r) receipts.push(r);
  });
  bundle.derived.forEach((row) => receipts.push(fromDerived(row)));

  receipts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return receipts;
}

export async function loadBundle(): Promise<DataBundle> {
  const res = await fetch("/data/bundle.json");
  if (!res.ok) throw new Error("Could not load life receipts bundle");
  return res.json() as Promise<DataBundle>;
}
