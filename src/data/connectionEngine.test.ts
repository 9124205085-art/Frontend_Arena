import { describe, expect, it } from "vitest";
import { detectConnections, buildEdgeIndex, otherId } from "./connectionEngine";
import type { Receipt } from "./types";

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

describe("detectConnections", () => {
  it("links receipts that are minutes apart", () => {
    const receipts = [
      rec({ id: "a", type: "music", timestamp: "2020-01-01T23:48:00", title: "Song" }),
      rec({ id: "b", type: "place", timestamp: "2020-01-01T23:56:00", title: "Beach", location: "Marina" }),
    ];
    const edges = detectConnections(receipts);
    const hit = edges.find((e) => (e.a === "a" && e.b === "b") || (e.a === "b" && e.b === "a"));
    expect(hit).toBeTruthy();
    expect(hit?.reason).toBe("temporal");
    expect(hit?.detail).toMatch(/minutes apart/);
  });

  it("links the same location across time", () => {
    const receipts = [
      rec({ id: "p1", type: "place", timestamp: "2020-02-01T10:00:00", location: "Dadar" }),
      rec({ id: "p2", type: "purchase", timestamp: "2020-02-02T10:00:00", location: "Dadar" }),
    ];
    const edges = detectConnections(receipts);
    const loc = edges.find((e) => e.reason === "same-location");
    expect(loc?.detail.toLowerCase()).toContain("dadar");
  });

  it("links shared rare tags", () => {
    const receipts = [
      rec({ id: "t1", type: "event", timestamp: "2020-03-01T10:00:00", tags: ["ganeshchaturthi"] }),
      rec({ id: "t2", type: "purchase", timestamp: "2020-03-01T12:00:00", tags: ["ganeshchaturthi"] }),
    ];
    const edges = detectConnections(receipts);
    expect(edges.some((e) => e.reason === "shared-tags")).toBe(true);
  });

  it("does not invent edges for a single isolated receipt", () => {
    expect(detectConnections([rec({ id: "solo", type: "note", timestamp: "2020-01-01T00:00:00" })])).toEqual([]);
  });
});

describe("buildEdgeIndex", () => {
  it("returns neighbors without scanning the full list twice", () => {
    const edges = detectConnections([
      rec({ id: "a", type: "music", timestamp: "2020-01-01T23:48:00", title: "Song" }),
      rec({ id: "b", type: "place", timestamp: "2020-01-01T23:56:00", title: "Beach", location: "Marina" }),
    ]);
    const index = buildEdgeIndex(edges);
    const fromA = index.get("a") ?? [];
    expect(fromA.length).toBeGreaterThan(0);
    expect(fromA.some((e) => otherId(e, "a") === "b")).toBe(true);
  });
});
