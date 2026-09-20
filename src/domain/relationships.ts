import type { ConnectionEdge } from "../data/types";
import { otherId } from "../data/connectionEngine";

export { detectConnections, buildEdgeIndex, otherId, edgesFor, getConnectionReason } from "../data/connectionEngine";

/**
 * Neighbor receipt ids for a node. Prefers the O(1) `edgesByNode` index
 * built at load; falls back to a linear scan of `edges` when needed.
 */
export function neighborIdsOf(
  id: string,
  edgesByNode?: Map<string, ConnectionEdge[]>,
  edges?: ConnectionEdge[],
): string[] {
  const indexed = edgesByNode?.get(id);
  if (indexed) return indexed.map((e) => otherId(e, id));
  if (!edges) return [];
  return edges.filter((e) => e.a === id || e.b === id).map((e) => otherId(e, id));
}
