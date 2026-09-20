import { useMemo } from "react";
import { create } from "zustand";
import { detectChapters } from "./data/chapterEngine";
import { detectConnections, otherId } from "./data/connectionEngine";
import { loadOfficialReceipts } from "./data/dataLoader";
import type { Chapter, ConnectionEdge, Receipt, ReceiptType } from "./data/types";
import { searchReceipts } from "./utils/analyzeData";
import { logDatasetReport } from "./utils/validateDataset";

interface LifeState {
  ready: boolean;
  error: string | null;
  receipts: Receipt[];
  edges: ConnectionEdge[];
  chapters: Chapter[];
  presentTypes: ReceiptType[];
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
  presentTypes: [],
  selectedId: null,
  query: "",
  activeTypes: [],
  toast: null,

  load: async () => {
    try {
      const receipts = await loadOfficialReceipts();
      const edges = detectConnections(receipts);
      const chapters = detectChapters(receipts);
      const presentTypes = [...new Set(receipts.map((r) => r.type))];
      logDatasetReport(receipts, { connections: edges.length, chapters: chapters.length, patternsNote: "computed in UI from receipts" });
      set({ receipts, edges, chapters, presentTypes, activeTypes: presentTypes, ready: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load archive", ready: false });
    }
  },
  select: (id) => set({ selectedId: id }),
  setQuery: (query) => set({ query }),
  toggleType: (t) => {
    const present = get().presentTypes;
    const cur = get().activeTypes;
    if (cur.length === present.length) {
      set({ activeTypes: [t] });
      return;
    }
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    set({ activeTypes: next.length ? next : present });
  },
  setTypes: (activeTypes) => set({ activeTypes }),
  setToast: (toast) => set({ toast }),
}));

export function useVisibleReceipts(): Receipt[] {
  const receipts = useLifeStore((s) => s.receipts);
  const query = useLifeStore((s) => s.query);
  const types = useLifeStore((s) => s.activeTypes);
  return useMemo(() => {
    const typed = receipts.filter((r) => types.includes(r.type));
    if (!query.trim()) return typed;
    const found = new Set(searchReceipts(query, typed).map((r) => r.id));
    return typed.filter((r) => found.has(r.id));
  }, [receipts, query, types]);
}

export const useFilteredReceipts = useVisibleReceipts;

export function neighborIds(id: string, edges: ConnectionEdge[]): string[] {
  return edges.filter((e) => e.a === id || e.b === id).map((e) => otherId(e, id));
}
