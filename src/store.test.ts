import { beforeEach, describe, expect, it } from "vitest";
import { buildEdgeIndex } from "./data/connectionEngine";
import type { ConnectionEdge, Receipt } from "./data/types";
import { neighborIds, useLifeStore } from "./store";

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
  rec({ id: "a", type: "music", timestamp: "2020-01-01T23:48:00", location: "Dadar" }),
  rec({ id: "b", type: "place", timestamp: "2020-01-01T23:56:00", location: "Dadar" }),
  rec({ id: "c", type: "purchase", timestamp: "2021-06-15T10:00:00", location: "Bandra" }),
];

const edges: ConnectionEdge[] = [
  { a: "a", b: "b", reason: "temporal", detail: "Connected because these two moments occurred 8 minutes apart.", weight: 3 },
];

describe("life store selection and traces", () => {
  beforeEach(() => {
    useLifeStore.setState({
      receipts,
      edges,
      edgesByNode: buildEdgeIndex(edges),
      presentTypes: ["music", "place", "purchase"],
      activeTypes: ["music", "place", "purchase"],
      selectedId: null,
      selectedEdge: null,
      selectedPlace: null,
      query: "",
      year: 2020,
      month: 1,
      hourLens: "night",
      locationLens: "Dadar",
      traceIds: ["x"],
      networkMode: "time",
    });
  });

  it("selects a receipt and clears the place lens", () => {
    useLifeStore.getState().select("a");
    expect(useLifeStore.getState().selectedId).toBe("a");
    expect(useLifeStore.getState().selectedPlace).toBeNull();
  });

  it("applyTrace focuses the first official id on the moments network", () => {
    useLifeStore.getState().applyTrace(["b", "a"]);
    const s = useLifeStore.getState();
    expect(s.traceIds).toEqual(["b", "a"]);
    expect(s.selectedId).toBe("b");
    expect(s.networkMode).toBe("moments");
    expect(s.selectedPlace).toBeNull();
  });

  it("clearLenses restores the full archive view", () => {
    useLifeStore.getState().clearLenses();
    const s = useLifeStore.getState();
    expect(s.year).toBeNull();
    expect(s.month).toBeNull();
    expect(s.hourLens).toBe("all");
    expect(s.locationLens).toBeNull();
    expect(s.traceIds).toBeNull();
    expect(s.selectedId).toBeNull();
    expect(s.activeTypes).toEqual(["music", "place", "purchase"]);
    expect(s.query).toBe("");
  });

  it("neighborIds uses the edge index for connected receipts", () => {
    expect(neighborIds("a")).toEqual(["b"]);
    expect(neighborIds("c")).toEqual([]);
  });
});
