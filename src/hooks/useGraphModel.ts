import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import { useLifeStore } from "../store";
import { formatDay } from "../utils/format";
import { TYPE_LABEL } from "../utils/constants";
import { layoutMoments, layoutPlaces, pickGraphReceipts, placeCooccurrence } from "../domain/graph";
import { useIsMobile } from "./useIsMobile";

/**
 * Graph geometry for the Memory Network. Selection lives in the store and in
 * node/edge components — this hook does not recompute layout when only the
 * selected id changes.
 */
export function useGraphModel() {
  const mode = useLifeStore((s) => s.networkMode);
  const year = useLifeStore((s) => s.year);
  const month = useLifeStore((s) => s.month);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const receiptById = useLifeStore((s) => s.receiptById);
  const edgesByNode = useLifeStore((s) => s.edgesByNode);
  const years = useLifeStore((s) => s.years);
  const types = useLifeStore((s) => s.activeTypes);
  const present = useLifeStore((s) => s.presentTypes);
  const hourLens = useLifeStore((s) => s.hourLens);
  const locationLens = useLifeStore((s) => s.locationLens);
  const traceIds = useLifeStore((s) => s.traceIds);
  const locs = useLifeStore((s) => s.locationStats);
  const connected = edgesByNode.size;
  const indexes = useMemo(() => ({ byId: receiptById, edgesByNode }), [receiptById, edgesByNode]);
  const mobile = useIsMobile();
  const compact = useIsMobile(1024);

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
        },
        mobile ? 48 : 96,
        indexes,
      ),
    [receipts, edges, types, present, year, month, hourLens, locationLens, traceIds, indexes, mobile],
  );

  const list = graph.nodes.slice(0, 20);
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
        type: "memory",
        source: `place::${e.a}`,
        target: `place::${e.b}`,
        data: { a: e.a, b: e.b, detail: e.detail, kind: "place" },
      }));
    }
    return graph.visEdges.map((e) => ({
      id: `${e.a}|${e.b}|${e.reason}`,
      type: "memory",
      source: e.a,
      target: e.b,
      data: { a: e.a, b: e.b, reason: e.reason, detail: e.detail },
    }));
  }, [mode, locs, graph.visEdges, receipts]);

  const filteredOn = Boolean(year || month || traceIds || hourLens !== "all" || locationLens);

  return {
    graph,
    rfNodes,
    rfEdges,
    list,
    compact,
    connected,
    years,
    mode,
    locs,
    filteredOn,
    graphEmptyHint: receipts.length === 0,
  };
}
