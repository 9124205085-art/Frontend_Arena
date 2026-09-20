import { useCallback, useEffect } from "react";
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
import type { ConnectionEdge } from "../../data/types";
import { MomentNode } from "./MomentNode";
import { PlaceNode } from "./PlaceNode";
import { MemoryEdge } from "./MemoryEdge";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const nodeTypes = { moment: MomentNode, place: PlaceNode };
const edgeTypes = { memory: MemoryEdge };

function NetworkCanvas({
  graph,
  rfNodes,
  rfEdges,
  compact,
}: {
  graph: { visEdges: ConnectionEdge[] };
  rfNodes: Node[];
  rfEdges: Edge[];
  compact: boolean;
}) {
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
  const types = useLifeStore((s) => s.activeTypes);
  const { fitView } = useReactFlow();
  const reduced = usePrefersReducedMotion();
  const motionMs = reduced ? 0 : undefined;

  useEffect(() => {
    if (useLifeStore.getState().selectedId) return;
    const t = window.setTimeout(() => {
      void fitView({ duration: motionMs ?? 380, padding: 0.28 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [mode, year, month, hourLens, locationLens, types, traceIds, fitView, motionMs]);

  useEffect(() => {
    if (!selectedId || mode === "places") return;
    const t = window.setTimeout(() => {
      const neigh = neighborIds(selectedId).slice(0, 8).map((id) => ({ id }));
      void fitView({
        nodes: [{ id: selectedId }, ...neigh],
        duration: motionMs ?? 520,
        padding: 1.15,
        maxZoom: 1.35,
      });
    }, 40);
    return () => window.clearTimeout(t);
  }, [selectedId, fitView, mode, motionMs]);

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

  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      const ids = node.type === "place" ? [node.id] : [node.id, ...neighborIds(node.id)];
      void fitView({ nodes: ids.slice(0, 10).map((id) => ({ id })), duration: motionMs ?? 450, padding: 0.7, maxZoom: 1.55 });
    },
    [fitView, motionMs],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onNodeDoubleClick={onNodeDoubleClick}
      fitView
      minZoom={compact ? 0.12 : 0.22}
      maxZoom={compact ? 1.85 : 2.2}
      panOnScroll={!compact}
      panOnDrag
      zoomOnPinch
      preventScrolling
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
      zoomOnDoubleClick={false}
      onlyRenderVisibleElements
      elevateNodesOnSelect={false}
      proOptions={{ hideAttribution: true }}
      aria-label="Memory network canvas. Use the connected moments list below to select with the keyboard."
      className="memory-flow"
    >
      <Background color="#222230" gap={22} size={1} />
      <Controls showInteractive={false} aria-label="Zoom and pan the memory network" className="!fill-white !shadow-none" />
    </ReactFlow>
  );
}

function Dust() {
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const count = reduced ? 0 : mobile ? 6 : 10;
  if (!count) return null;
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

export default function MemoryCanvas({
  graph,
  rfNodes,
  rfEdges,
  compact,
  empty,
  selected,
  filtered,
  onReset,
}: {
  graph: { visEdges: ConnectionEdge[] };
  rfNodes: Node[];
  rfEdges: Edge[];
  compact: boolean;
  empty: boolean;
  selected: boolean;
  filtered?: boolean;
  onReset?: () => void;
}) {
  return (
    <div
      className="relative mt-4 h-[min(62dvh,520px)] overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0B0B10] sm:h-[min(68vh,640px)] lg:h-[min(74vh,720px)]"
      role="region"
      aria-label="Memory network canvas"
    >
      <Dust />
      <ReactFlowProvider>
        <NetworkCanvas graph={graph} rfNodes={rfNodes} rfEdges={rfEdges} compact={compact} />
      </ReactFlowProvider>
      {!empty && (
        <p className="pointer-events-none absolute left-3 top-3 max-w-[min(22rem,78%)] rounded-xl bg-[#0B0B10]/75 px-3 py-2 text-sm leading-snug text-white/90 backdrop-blur-sm sm:left-4 sm:top-4 sm:text-base">
          {selected
            ? "Brighter dots are linked to this moment. Follow a line to see why."
            : compact
              ? "Each dot is a moment. Tap one to open its story."
              : "Each dot is a moment. Lines are relationships. Click a moment to explore."}
        </p>
      )}
      {empty && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0B0B10]/80 px-4 text-center" role="status">
          <p className="text-lg font-semibold text-white">
            {filtered ? "No moments match this view." : "The archive has not loaded yet."}
          </p>
          <p className="max-w-sm text-base text-mute">
            {filtered
              ? "Clear the year, month, or pattern filter to bring the network back."
              : "Official records become dots. Relationships become lines."}
          </p>
          {filtered && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="min-h-12 rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Reset view
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
