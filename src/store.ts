import { useMemo } from "react";
import { create } from "zustand";
import { detectChapters } from "./data/chapterEngine";
import { detectConnections, otherId } from "./data/connectionEngine";
import { loadBundle, normalizeBundle } from "./data/dataLoader";
import type { Chapter, ConnectionEdge, Receipt, ReceiptType } from "./data/types";
import { RECEIPT_TYPES } from "./data/types";
import { searchReceipts } from "./utils/analyzeData";

interface LifeState {
  ready: boolean;
  error: string | null;
  receipts: Receipt[];
  edges: ConnectionEdge[];
  chapters: Chapter[];
  selectedId: string | null;
  query: string;
  activeTypes: ReceiptType[];
  toast: string | null;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  setQuery: (q: string) => void;
  toggleType: (t: ReceiptType) => void;
  setTypes: (t: ReceiptType[]) => void;
  setToast: (msg: string | null) => void;
}

export const useLifeStore = create<LifeState>((set, get) => ({
  ready: false,
  error: null,
  receipts: [],
  edges: [],
  chapters: [],
  selectedId: null,
  query: "",
  activeTypes: [...RECEIPT_TYPES],
  toast: null,

  load: async () => {
    try {
      const bundle = await loadBundle();
      const receipts = normalizeBundle(bundle);
      const edges = detectConnections(receipts);
      const chapters = detectChapters(receipts);
      set({ receipts, edges, chapters, ready: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load archive", ready: false });
    }
  },
  select: (id) => set({ selectedId: id }),
  setQuery: (query) => set({ query }),
  toggleType: (t) => {
    const cur = get().activeTypes;
    if (cur.length === RECEIPT_TYPES.length) {
      set({ activeTypes: [t] });
      return;
    }
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    set({ activeTypes: next.length ? next : [...RECEIPT_TYPES] });
  },
  setTypes: (activeTypes) => set({ activeTypes }),
  setToast: (toast) => set({ toast }),
}));

export function useVisibleReceipts(): Receipt[] {
  const receipts = useLifeStore((s) => s.receipts);
  const query = useLifeStore((s) => s.query);
  const types = useLifeStore((s) => s.activeTypes);
  return useMemo(
    () => receipts.filter((r) => types.includes(r.type)).filter((r) => (query ? searchReceipts(query, [r]).length > 0 : true)),
    [receipts, query, types],
  );
}

export const useFilteredReceipts = useVisibleReceipts;

export function neighborIds(id: string, edges: ConnectionEdge[]): string[] {
  return edges.filter((e) => e.a === id || e.b === id).map((e) => otherId(e, id));
}
