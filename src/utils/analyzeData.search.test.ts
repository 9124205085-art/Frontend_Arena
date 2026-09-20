import { describe, expect, it } from "vitest";
import { searchReceipts } from "./analyzeData";
import type { Receipt } from "../data/types";

const sample: Receipt[] = [
  {
    id: "1",
    type: "music",
    timestamp: "2020-01-01T23:48:00",
    title: "Midnight City",
    description: "M83",
    tags: ["music"],
    relatedIds: [],
    source: "spotify",
    extra: { artist: "M83" },
  },
  {
    id: "2",
    type: "place",
    timestamp: "2020-01-01T12:00:00",
    title: "Office",
    description: "commute",
    location: "Dadar",
    tags: ["place"],
    relatedIds: [],
    source: "india",
  },
];

describe("searchReceipts", () => {
  it("returns empty for blank query", () => {
    expect(searchReceipts("   ", sample)).toEqual([]);
  });

  it("finds a title", () => {
    expect(searchReceipts("midnight", sample).map((r) => r.id)).toEqual(["1"]);
  });

  it("finds a location", () => {
    expect(searchReceipts("dadar", sample).map((r) => r.id)).toEqual(["2"]);
  });

  it("finds a category/type", () => {
    expect(searchReceipts("music", sample).some((r) => r.id === "1")).toBe(true);
  });
});
