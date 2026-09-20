import { buildEdgeIndex } from "../data/connectionEngine";
import type { ConnectionEdge, Receipt } from "../data/types";

/** Built once after archive load. Used for O(1) receipt lookup and O(degree) neighbors. */
export function indexArchive(receipts: Receipt[], edges: ConnectionEdge[]) {
  const receiptById = new Map<string, Receipt>();
  for (const receipt of receipts) receiptById.set(receipt.id, receipt);
  return { receiptById, edgesByNode: buildEdgeIndex(edges) };
}
