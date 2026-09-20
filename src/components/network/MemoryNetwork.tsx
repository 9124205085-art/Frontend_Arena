import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { neighborIds, useLifeStore } from "../../store";
import { formatDay } from "../../utils/format";
import { layoutMoments, layoutPlaces, pickGraphReceipts, placeCooccurrence } from "../../utils/networkGraph";
import { TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import type { ConnectionEdge } from "../../data/types";
import FilterChips from "../FilterChips";
import { MemoryEdge } from "./MemoryEdge";
import { MomentNode } from "./MomentNode";
import { PlaceNode } from "./PlaceNode";
import { useIsMobile } from "../../hooks/useIsMobile";

const nodeTypes = { moment: MomentNode, place: PlaceNode };
const edgeTypes = { memory: MemoryEdge };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function edgeData(e: { detail: string; a?: string; b?: string; reason?: string }): Record<string, unknown> {
  return { ...e };
}

function NetworkCanvas() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const types = useLifeStore((s) => s.activeTypes);
  const present = useLifeStore((s) => s.presentTypes);
  const selectedId = useLifeStore((s) => s.selectedId);
  const select = useLifeStore((s) => s.select);
  const selectEdge = useLifeStore((s) => s.selectEdge);
  const selectPlace = useLifeStore((s) => s.selectPlace);
  const mode = useLifeStore((s) => s.networkMode);
  const year = useLifeStore((s) => s.year);
  const month = useLifeStore((s) => s.month);
  const hourLens = useLifeStore((s) => s.hourLens);
  const locationLens = useLifeStore((s) => s.locationLens);
  const traceIds = useLifeStore((s) => s.traceIds);
  const query = useLifeStore((s) => s.query);
  const locs = useLifeStore((s) => s.locationStats);
  const mobile = useIsMobile();
  const { fitView } = useReactFlow();

  const graph = useMemo(
    () =>
      pickGraphReceipts(
        receipts,
        edges,
        {
          types,
          presentTypes: present,
          year,
          month,
          hourLens,
          location: locationLens,
          traceIds,
          query,
        },
        mobile ? 48 : 96,
      ),
    [receipts, edges, types, present, year, month, hourLens, locationLens, traceIds, query, mobile],
  );

  const positions = useMemo(() => {
    if (mode === "places") return layoutPlaces(locs);
    return layoutMoments(graph.nodes, mode);
  }, [mode, locs, graph.nodes]);

  const rfNodes: Node[] = useMemo(() => {
    if (mode === "places") {
      return locs.map((l) => ({
        id: `place::${l.location}`,
        type: "place",
        position: positions.get(l.location) ?? { x: 0, y: 0 },
        data: {
          location: l.location,
          count: l.count,
          mix: Object.entries(l.byType)
            .map(([t, n]) => `${TYPE_LABEL[t as keyof typeof TYPE_LABEL]} ${n}`)
            .join(" · "),
        },
      }));
    }
    return graph.nodes.map((n) => ({
      id: n.id,
      type: "moment",
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: {
        title: n.title,
        type: n.type,
        when: formatDay(n.timestamp),
        preview: n.description,
      },
    }));
  }, [mode, locs, graph.nodes, positions]);

  const rfEdges: Edge[] = useMemo(() => {
    if (mode === "places") {
      return placeCooccurrence(
        receipts,
        locs.map((l) => l.location),
      ).map((e, i) => ({
        id: `pl-${i}`,
        source: `place::${e.a}`,
        target: `place::${e.b}`,
        type: "memory",
        data: { ...edgeData(e), kind: "place" },
      }));
    }
    return graph.visEdges.map((e) => ({
      id: `${e.a}|${e.b}|${e.reason}`,
      source: e.a,
      target: e.b,
      type: "memory",
      data: edgeData(e),
    }));
  }, [mode, locs, graph.visEdges, receipts]);

  useEffect(() => {
    if (useLifeStore.getState().selectedId) return;
    const t = window.setTimeout(() => {
      void fitView({ duration: 380, padding: 0.28 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [mode, year, month, hourLens, locationLens, types, traceIds, query, fitView]);

  useEffect(() => {
    if (!selectedId || mode === "places") return;
    const t = window.setTimeout(() => {
      const neigh = neighborIds(selectedId, edges).map((id) => ({ id }));
      void fitView({
        nodes: [{ id: selectedId }, ...neigh.slice(0, 8)],
        duration: 520,
        padding: 1.15,
        maxZoom: 1.35,
      });
    }, 40);
    return () => window.clearTimeout(t);
  }, [selectedId, fitView, mode, edges]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === "place") {
        const loc = String((node.data as { location?: string }).location || "");
        selectPlace(loc);
        return;
      }
      select(node.id);
    },
    [select, selectPlace],
  );

  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      if (mode === "places") {
        const detail = String((edge.data as { detail?: string } | undefined)?.detail || "These locations appear on the same day in the archive.");
        const rec: ConnectionEdge = {
          a: String(edge.source).replace("place::", ""),
          b: String(edge.target).replace("place::", ""),
          reason: "same-day",
          detail,
          weight: 1,
        };
        selectEdge(rec);
        return;
      }
      const rec = graph.visEdges.find((e) => `${e.a}|${e.b}|${e.reason}` === edge.id);
      if (rec) {
        selectEdge(rec);
        select(rec.a);
      }
    },
    [graph.visEdges, select, selectEdge, mode],
  );

  const onPaneClick = useCallback(() => {
    select(null);
    selectEdge(null);
    selectPlace(null);
  }, [select, selectEdge, selectPlace]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onNodeDoubleClick={(_, node) => {
        const ids = node.type === "place" ? [node.id] : [node.id, ...neighborIds(node.id, edges).map((id) => id)];
        void fitView({ nodes: ids.slice(0, 10).map((id) => ({ id })), duration: 450, padding: 0.7, maxZoom: 1.55 });
      }}
      fitView
      minZoom={0.22}
      maxZoom={2.2}
      panOnScroll
      panOnDrag
      nodesDraggable={false}
      nodesConnectable={false}
      edgesReconnectable={false}
      zoomOnDoubleClick={false}
      onlyRenderVisibleElements
      proOptions={{ hideAttribution: true }}
      className="memory-flow"
    >
      <Background color="#222230" gap={22} size={1} />
      <Controls showInteractive={false} className="!fill-white !shadow-none" />
    </ReactFlow>
  );
}

function Dust() {
  const mobile = useIsMobile();
  const count = mobile ? 8 : 16;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="network-dust absolute h-1 w-1 rounded-full bg-white/25"
          style={{
            left: `${(i * 19 + 7) % 100}%`,
            top: `${(i * 31 + 11) % 100}%`,
            animationDelay: `${i * 0.45}s`,
            animationDuration: `${9 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function MemoryNetwork({ hint }: { hint?: string }) {
  const mode = useLifeStore((s) => s.networkMode);
  const setMode = useLifeStore((s) => s.setNetworkMode);
  const year = useLifeStore((s) => s.year);
  const setYear = useLifeStore((s) => s.setYear);
  const month = useLifeStore((s) => s.month);
  const setMonth = useLifeStore((s) => s.setMonth);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const years = useLifeStore((s) => s.years);
  const select = useLifeStore((s) => s.select);
  const selectedId = useLifeStore((s) => s.selectedId);
  const types = useLifeStore((s) => s.activeTypes);
  const present = useLifeStore((s) => s.presentTypes);
  const hourLens = useLifeStore((s) => s.hourLens);
  const locationLens = useLifeStore((s) => s.locationLens);
  const traceIds = useLifeStore((s) => s.traceIds);
  const query = useLifeStore((s) => s.query);
  const connected = useMemo(() => new Set(edges.flatMap((e) => [e.a, e.b])).size, [edges]);
  const list = useMemo(
    () =>
      pickGraphReceipts(receipts, edges, {
        types,
        presentTypes: present,
        year,
        month,
        hourLens,
        location: locationLens,
        traceIds,
        query,
      }).nodes.slice(0, 20),
    [receipts, edges, types, present, year, month, hourLens, locationLens, traceIds, query],
  );
  const clearLenses = useLifeStore((s) => s.clearLenses);
  const graphEmptyHint = receipts.length === 0;

  const filteredOn = Boolean(year || month || traceIds || hourLens !== "all" || locationLens);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Memory network</h2>
          <p className="mt-1 text-sm text-mute">
            {hint ?? "Each dot is a moment. Lines show relationships. Click a moment to explore."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filteredOn && (
            <button
              type="button"
              onClick={() => clearLenses()}
              className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute hover:text-white"
            >
              Reset view
            </button>
          )}
          <div className="flex gap-1 rounded-full border border-white/[0.08] p-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {(["moments", "places", "time"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 rounded-full px-3 py-1.5 ${mode === m ? "bg-accent text-white" : "text-mute hover:text-white"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <FilterChips />
      </div>

      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-x-3 top-[15px] h-px bg-white/[0.08]" />
        <div className="no-scrollbar relative flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setYear(null)}
            aria-pressed={year == null}
            className={`min-h-11 shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
              year == null ? "border-accent text-white" : "border-white/[0.08] text-mute"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              aria-pressed={year === y}
              className={`min-h-11 shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
                year === y ? "border-accent text-white" : "border-white/[0.08] text-mute"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMonth(null)}
          aria-pressed={month == null}
          className={`min-h-11 shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
            month == null ? "border-accent/70 text-white" : "border-white/[0.08] text-mute"
          }`}
        >
          All months
        </button>
        {MONTHS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setMonth(i + 1)}
            aria-pressed={month === i + 1}
            className={`min-h-11 shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
              month === i + 1 ? "border-accent text-white" : "border-white/[0.08] text-mute"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-mute">
        Showing a connected sample of the archive
        {selectedId
          ? " · brighter nodes are linked to your selection"
          : ` · ${connected.toLocaleString("en-IN")} receipts have at least one stored relationship`}
        . Click a line to see why two moments connect.
      </p>

      <div className="relative mt-4 h-[min(68vh,640px)] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0B10]">
        <Dust />
        <ReactFlowProvider>
          <NetworkCanvas />
        </ReactFlowProvider>
        <p className="pointer-events-none absolute left-4 top-4 text-[10px] uppercase tracking-[0.2em] text-mute">
          Drag to pan · scroll to zoom · double-click to focus · Esc clears
        </p>
        {graphEmptyHint && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-mute">
            The archive has not loaded yet.
          </p>
        )}
      </div>

      <section className="mt-4" aria-labelledby="graph-list-title">
        <h3 id="graph-list-title" className="text-sm font-semibold">
          {list.length} connected moments in this view
        </h3>
        <p className="mt-1 text-xs text-mute">Keyboard alternative to the canvas. Enter selects a receipt.</p>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-white/[0.08] p-2">
          {list.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-current={selectedId === r.id ? "true" : undefined}
                onClick={() => select(r.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                  selectedId === r.id ? "bg-accent/20 text-white" : "text-mute hover:text-white"
                }`}
              >
                <span aria-hidden>{TYPE_ICON[r.type]}</span>
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider">{TYPE_LABEL[r.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
