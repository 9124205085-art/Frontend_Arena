import { create } from "zustand";
import { otherId } from "./data/connectionEngine";
import type { Chapter, ConnectionEdge, Receipt, ReceiptType } from "./data/types";
import type { Pattern } from "./utils/analyzeData";
import type { HourLens, NetworkMode } from "./utils/networkGraph";
import type { getLocationStats, getOverview } from "./utils/analyzeData";

type OverviewStats = ReturnType<typeof getOverview>;
type LocationStat = ReturnType<typeof getLocationStats>[number];

interface LifeState {
  ready: boolean;
  error: string | null;
  receipts: Receipt[];
  edges: ConnectionEdge[];
  receiptById: Map<string, Receipt>;
  edgesByNode: Map<string, ConnectionEdge[]>;
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
  overview: OverviewStats | null;
  patterns: Pattern[];
  years: number[];
  locationStats: LocationStat[];
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
  receiptById: new Map(),
  edgesByNode: new Map(),
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
  overview: null,
  patterns: [],
  years: [],
  locationStats: [],

  load: async () => {
    try {
      const [{ loadOfficialArchive }, { indexArchive }] = await Promise.all([
        import("./data/dataLoader"),
        import("./lib/archiveIndex"),
      ]);
      const bundle = await loadOfficialArchive();
      const indexed = indexArchive(bundle.receipts, bundle.edges);
      set({
        receipts: bundle.receipts,
        edges: bundle.edges,
        receiptById: indexed.receiptById,
        edgesByNode: indexed.edgesByNode,
        chapters: bundle.chapters,
        presentTypes: bundle.presentTypes,
        activeTypes: bundle.presentTypes,
        overview: bundle.overview,
        patterns: bundle.patterns,
        years: bundle.years,
        locationStats: bundle.locationStats,
        ready: true,
        error: null,
      });
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
    const ids: string[] = [];
    for (const r of get().receipts) {
      if (r.location !== loc) continue;
      ids.push(r.id);
      if (ids.length >= 96) break;
    }
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

export function neighborIds(id: string, edges?: ConnectionEdge[]): string[] {
  const indexed = useLifeStore.getState().edgesByNode.get(id);
  if (indexed) return indexed.map((e) => otherId(e, id));
  if (!edges) return [];
  return edges.filter((e) => e.a === id || e.b === id).map((e) => otherId(e, id));
}
