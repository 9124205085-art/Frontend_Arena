import { describe, expect, it } from "vitest";
import type { ConnectionEdge, Receipt } from "../data/types";
import { buildStoryPath, pickGraphReceipts, placeCooccurrence } from "./networkGraph";

function rec(partial: Partial<Receipt> & Pick<Receipt, "id" | "timestamp" | "type">): Receipt {
  return {
    title: partial.title ?? partial.id,
    description: partial.description ?? "",
    tags: partial.tags ?? [],
    relatedIds: [],
    source: partial.source ?? "household",
    ...partial,
  };
}

const receipts: Receipt[] = [
  rec({ id: "a", type: "music", timestamp: "2020-01-01T23:48:00", title: "Song", location: "Dadar" }),
  rec({ id: "b", type: "place", timestamp: "2020-01-01T23:56:00", title: "Walk", location: "Dadar" }),
  rec({ id: "c", type: "purchase", timestamp: "2021-06-15T10:00:00", title: "Market", location: "Bandra" }),
];

const edges: ConnectionEdge[] = [
  { a: "a", b: "b", reason: "temporal", detail: "Connected because these two moments occurred 8 minutes apart.", weight: 3 },
];

const baseFilter = {
  types: ["music", "place", "purchase"] as Receipt["type"][],
  presentTypes: ["music", "place", "purchase"] as Receipt["type"][],
  year: null,
  month: null,
  hourLens: "all" as const,
  location: null,
  traceIds: null,
  query: "",
};

describe("pickGraphReceipts", () => {
  it("keeps connected neighbors when filtering by year", () => {
    const { nodes, visEdges } = pickGraphReceipts(receipts, edges, { ...baseFilter, year: 2020 }, 96);
    const ids = nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["a", "b"]);
    expect(visEdges).toHaveLength(1);
    expect(nodes.some((n) => n.id === "c")).toBe(false);
  });

  it("filters by location from the actual records", () => {
    const { nodes } = pickGraphReceipts(receipts, edges, { ...baseFilter, location: "Bandra" }, 96);
    expect(nodes.map((n) => n.id)).toEqual(["c"]);
  });
});

describe("buildStoryPath", () => {
  it("walks stored edges from the selected receipt and sorts by time", () => {
    const path = buildStoryPath(receipts[1]!, receipts, edges, 5);
    expect(path.map((r) => r.id)).toEqual(["a", "b"]);
    expect(path[0]!.timestamp < path[1]!.timestamp).toBe(true);
  });

  it("does not invent a path when the receipt has no edges", () => {
    expect(buildStoryPath(receipts[2]!, receipts, edges, 5).map((r) => r.id)).toEqual(["c"]);
  });
});

describe("placeCooccurrence", () => {
  it("explains same-day locations from the dataset", () => {
    const hits = placeCooccurrence(
      [
        rec({ id: "p1", type: "place", timestamp: "2020-01-01T10:00:00", location: "Dadar" }),
        rec({ id: "p2", type: "purchase", timestamp: "2020-01-01T12:00:00", location: "Bandra" }),
      ],
      ["Dadar", "Bandra"],
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]!.detail).toMatch(/2020-01-01/);
  });
});
