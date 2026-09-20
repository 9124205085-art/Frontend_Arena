import { describe, expect, it } from "vitest";
import { dedupeReceipts, validateReceipt } from "./validateReceipt";

describe("validateReceipt", () => {
  it("rejects missing id or timestamp", () => {
    expect(validateReceipt({ title: "x", type: "music", source: "spotify" })).toBeNull();
    expect(
      validateReceipt({
        id: "ok-id-1",
        type: "music",
        timestamp: "not-a-date",
        title: "Song",
        source: "spotify",
      }),
    ).toBeNull();
  });

  it("accepts a complete official-shaped record", () => {
    const r = validateReceipt({
      id: "sp-1",
      type: "music",
      timestamp: "2020-01-01T00:00:00",
      title: "Track",
      description: "desc",
      tags: ["music"],
      relatedIds: ["ghost"],
      source: "spotify",
    });
    expect(r?.id).toBe("sp-1");
    expect(r?.relatedIds).toEqual([]);
  });

  it("drops duplicate ids, keeping the first", () => {
    const a = validateReceipt({
      id: "same",
      type: "purchase",
      timestamp: "2020-01-01T00:00:00",
      title: "One",
      source: "household",
    })!;
    const b = validateReceipt({
      id: "same",
      type: "purchase",
      timestamp: "2020-01-02T00:00:00",
      title: "Two",
      source: "household",
    })!;
    expect(dedupeReceipts([a, b])).toHaveLength(1);
    expect(dedupeReceipts([a, b])[0].title).toBe("One");
  });
});
