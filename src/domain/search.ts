import type { Receipt } from "../data/types";
import { hourOf } from "./time";

/**
 * Case-insensitive search over title, description, tags, location, type, timestamp, and selected extra fields.
 * Optional phrase aliases expand contest-style queries (e.g. "late night" → nocturnal mood).
 */
export function searchReceipts(query: string, receipts: Receipt[], limit = 80): Receipt[] {
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
  const out: Receipt[] = [];
  for (const r of receipts) {
    if (nightHours && (hourOf(r.timestamp) >= 22 || hourOf(r.timestamp) <= 1)) {
      out.push(r);
    } else if (receiptMatchesQuery(r, q, extra)) {
      out.push(r);
    }
    if (out.length >= limit) break;
  }
  return out;
}

function receiptMatchesQuery(r: Receipt, q: string, extra: string[]): boolean {
  if (fieldHas(r.title, q) || r.type.includes(q) || r.source.includes(q)) return true;
  if (r.location && fieldHas(r.location, q)) return true;
  if (r.mood && r.mood.includes(q)) return true;
  if (r.timestamp.includes(q)) return true;
  const extraFields = r.extra;
  if (extraFields) {
    if (fieldHas(String(extraFields.artist || ""), q)) return true;
    if (fieldHas(String(extraFields.merchant || ""), q)) return true;
    if (fieldHas(String(extraFields.person || ""), q)) return true;
    if (fieldHas(String(extraFields.category || ""), q)) return true;
  }
  if (r.tags.some((tag) => tag.includes(q))) return true;
  if (fieldHas(r.description, q)) return true;
  return extra.some((token) => receiptMatchesQuery(r, token, []));
}

function fieldHas(value: string, q: string): boolean {
  return Boolean(value) && value.toLowerCase().includes(q);
}
