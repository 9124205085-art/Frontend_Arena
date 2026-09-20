import type { Receipt, ReceiptType } from "../data/types";

export interface DatasetReport {
  total: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  missingTimestamp: number;
  duplicateIds: number;
  invalidRefs: number;
  locations: number;
  dateStart: string | null;
  dateEnd: string | null;
}

export function validateReceipts(receipts: Receipt[]): DatasetReport {
  const bySource: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const ids = new Map<string, number>();
  const idSet = new Set<string>();
  let missingTimestamp = 0;
  let invalidRefs = 0;
  const locations = new Set<string>();
  let dateStart: string | null = null;
  let dateEnd: string | null = null;

  for (const r of receipts) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    ids.set(r.id, (ids.get(r.id) ?? 0) + 1);
    idSet.add(r.id);
    if (!r.timestamp || Number.isNaN(new Date(r.timestamp).getTime())) missingTimestamp += 1;
    else {
      if (!dateStart || r.timestamp < dateStart) dateStart = r.timestamp;
      if (!dateEnd || r.timestamp > dateEnd) dateEnd = r.timestamp;
    }
    if (r.location) locations.add(r.location);
  }
  for (const r of receipts) {
    for (const id of r.relatedIds) {
      if (!idSet.has(id)) invalidRefs += 1;
    }
  }

  return {
    total: receipts.length,
    bySource,
    byType,
    missingTimestamp,
    duplicateIds: [...ids.values()].filter((n) => n > 1).length,
    invalidRefs,
    locations: locations.size,
    dateStart,
    dateEnd,
  };
}

export function logDatasetReport(receipts: Receipt[], extra?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  const report = validateReceipts(receipts);
  console.info("[dataset]", { ...report, ...extra });
}

export type { ReceiptType };
