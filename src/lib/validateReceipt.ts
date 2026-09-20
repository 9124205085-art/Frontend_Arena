import type { Receipt, ReceiptType } from "../data/types";
import { RECEIPT_TYPES } from "../data/types";
import { sanitizeText } from "./sanitize";

const TYPES = new Set<string>(RECEIPT_TYPES);

export function validateReceipt(value: unknown): Receipt | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<Receipt>;
  if (typeof r.id !== "string" || r.id.length < 3) return null;
  if (typeof r.type !== "string" || !TYPES.has(r.type)) return null;
  if (typeof r.timestamp !== "string" || Number.isNaN(new Date(r.timestamp).getTime())) return null;
  if (typeof r.title !== "string" || !r.title.trim()) return null;
  if (r.source !== "household" && r.source !== "spotify" && r.source !== "india") return null;

  return {
    id: r.id,
    type: r.type as ReceiptType,
    timestamp: r.timestamp,
    title: sanitizeText(r.title, 160),
    description: sanitizeText(r.description ?? "", 420),
    location: r.location ? sanitizeText(r.location, 80) : undefined,
    tags: Array.isArray(r.tags) ? r.tags.map((t) => sanitizeText(t, 32)).filter(Boolean).slice(0, 12) : [],
    mood: r.mood ? sanitizeText(r.mood, 24) : undefined,
    relatedIds: [],
    amount: typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : undefined,
    currency: r.currency ? sanitizeText(r.currency, 8) : undefined,
    source: r.source,
    extra: r.extra && typeof r.extra === "object" ? sanitizeExtra(r.extra) : undefined,
  };
}

function sanitizeExtra(extra: Receipt["extra"]): Receipt["extra"] {
  if (!extra) return undefined;
  const out: NonNullable<Receipt["extra"]> = {};
  for (const [k, v] of Object.entries(extra)) {
    const key = sanitizeText(k, 32);
    if (!key) continue;
    if (typeof v === "string") out[key] = sanitizeText(v, 160);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[key] = v;
  }
  return out;
}

export function dedupeReceipts(receipts: Receipt[]): Receipt[] {
  const seen = new Set<string>();
  const out: Receipt[] = [];
  for (const r of receipts) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
