export const RECEIPT_TYPES = [
  "music",
  "movie",
  "place",
  "purchase",
  "photo",
  "message",
  "search",
  "event",
  "note",
] as const;

export type ReceiptType = (typeof RECEIPT_TYPES)[number];

export type ReceiptSource = "household" | "spotify" | "india";

export interface Receipt {
  id: string;
  type: ReceiptType;
  timestamp: string;
  title: string;
  description: string;
  location?: string;
  tags: string[];
  mood?: string;
  relatedIds: string[];
  amount?: number;
  currency?: string;
  source: ReceiptSource;
  extra?: Record<string, string | number | boolean | null>;
}

export type ConnectionReason =
  | "temporal"
  | "same-day"
  | "same-week"
  | "same-location"
  | "shared-tags"
  | "same-entity"
  | "explicit-mention";

export interface ConnectionEdge {
  a: string;
  b: string;
  reason: ConnectionReason;
  detail: string;
  weight: number;
}

export type StoryVisual = "frequency" | "ledger" | "wander";

export interface Chapter {
  id: string;
  title: string;
  kicker: string;
  description: string;
  start: string;
  end: string;
  receiptIds: string[];
  themes: string[];
  visual: StoryVisual;
  nightOwlScore: number;
}

export interface HouseholdRow {
  Date: string;
  Mode: string;
  Category: string;
  Subcategory: string;
  Note: string;
  Amount: string;
  "Income/Expense": string;
  Currency: string;
}

export interface SpotifyRow {
  spotify_track_uri: string;
  ts: string;
  platform: string;
  ms_played: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  reason_start: string;
  reason_end: string;
  shuffle: string;
  skipped: string;
}

export interface IndiaRow {
  trans_id: string;
  trans_date_trans_time: string;
  merchant: string;
  category: string;
  amt: string;
  city: string;
  state: string;
  job?: string;
  is_fraud?: string;
  first?: string;
  last?: string;
}

export interface DerivedRow {
  id: string;
  kind: ReceiptType | "movie";
  timestamp: string;
  title: string;
  body: string;
  location?: string;
  tags: string[];
  mood?: string;
  mentions?: string[];
}

export interface DataBundle {
  generatedAt: string;
  sources: Record<string, { file: string; originalRows: number; sampled: number }>;
  household: HouseholdRow[];
  spotify: SpotifyRow[];
  india: IndiaRow[];
  derived: DerivedRow[];
}

export type AppMode = "landing" | "story" | "explore";
