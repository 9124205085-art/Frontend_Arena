import { useMemo } from "react";
import { create } from "zustand";
import { detectChapters } from "./data/chapterEngine";
import { detectConnections, otherId } from "./data/connectionEngine";
import { loadOfficialReceipts } from "./data/dataLoader";
import type { Chapter, ConnectionEdge, Receipt, ReceiptType } from "./data/types";
import { searchReceipts } from "./utils/analyzeData";
import { logDatasetReport } from "./utils/validateDataset";
import type { HourLens, NetworkMode } from "./utils/networkGraph";

interface LifeState {
  ready: boolean;
  error: string | null;
  receipts: Receipt[];
  edges: ConnectionEdge[];
  chapters: Chapter[];
  presentTypes: ReceiptType[];
  selectedId: string | null;
  selectedEdge: ConnectionEdge | null;
  query: string;
  activeTypes: ReceiptType[];
  networkMode: NetworkMode;
  year: number | null;
  month: number | null;
  hourLens: HourLens;
  locationLens: string | null;
  selectedPlace: string | null;
  traceIds: string[] | null;
  storyPlaying: boolean;
  toast: string | null;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  selectEdge: (edge: ConnectionEdge | null) => void;
  selectPlace: (loc: string | null) => void;
  setQuery: (q: string) => void;
  toggleType: (t: ReceiptType) => void;
  setTypes: (t: ReceiptType[]) => void;
  setNetworkMode: (m: NetworkMode) => void;
  setYear: (y: number | null) => void;
  setMonth: (m: number | null) => void;
  setHourLens: (h: HourLens) => void;
  setLocationLens: (loc: string | null) => void;
  applyTrace: (ids: string[]) => void;
  explorePlace: (loc: string) => void;
  clearLenses: () => void;
  setStoryPlaying: (v: boolean) => void;
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
  selectedEdge: null,
  query: "",
  activeTypes: [],
  networkMode: "moments",
  year: null,
  month: null,
  hourLens: "all",
  locationLens: null,
  selectedPlace: null,
  traceIds: null,
  storyPlaying: false,
  toast: null,

  load: async () => {
    try {
      const receipts = await loadOfficialReceipts();
      const edges = detectConnections(receipts);
      const chapters = detectChapters(receipts);
      const presentTypes = [...new Set(receipts.map((r) => r.type))];
      logDatasetReport(receipts, { connections: edges.length, chapters: chapters.length });
      set({ receipts, edges, chapters, presentTypes, activeTypes: presentTypes, ready: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load archive", ready: false });
    }
  },
  select: (id) =>
    set({
      selectedId: id,
      selectedEdge: id ? get().selectedEdge : null,
      selectedPlace: id ? null : get().selectedPlace,
    }),
  selectEdge: (selectedEdge) => set({ selectedEdge }),
  selectPlace: (selectedPlace) =>
    set({
      selectedPlace,
      selectedId: selectedPlace ? null : get().selectedId,
      selectedEdge: selectedPlace ? null : get().selectedEdge,
      networkMode: selectedPlace ? "places" : get().networkMode,
    }),
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
  setNetworkMode: (networkMode) => set({ networkMode }),
  setYear: (year) => set({ year }),
  setMonth: (month) => set({ month }),
  setHourLens: (hourLens) => set({ hourLens, traceIds: null }),
  setLocationLens: (locationLens) => set({ locationLens }),
  applyTrace: (ids) =>
    set({
      traceIds: ids,
      selectedId: ids[0] ?? null,
      selectedPlace: null,
      selectedEdge: null,
      networkMode: "moments",
    }),
  explorePlace: (loc) => {
    const ids = get()
      .receipts.filter((r) => r.location === loc)
      .slice(0, 96)
      .map((r) => r.id);
    set({
      locationLens: loc,
      selectedPlace: loc,
      traceIds: ids,
      selectedId: ids[0] ?? null,
      selectedEdge: null,
      networkMode: "moments",
    });
  },
  clearLenses: () =>
    set({
      year: null,
      month: null,
      hourLens: "all",
      locationLens: null,
      selectedPlace: null,
      traceIds: null,
      selectedId: null,
      selectedEdge: null,
      activeTypes: get().presentTypes,
      query: "",
      networkMode: "moments",
    }),
  setStoryPlaying: (storyPlaying) => set({ storyPlaying }),
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
