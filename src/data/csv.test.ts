import { describe, expect, it } from "vitest";
import { parseCsv } from "../data/csv";

describe("parseCsv", () => {
  it("parses headers and quoted commas", () => {
    const rows = parseCsv('Name,Note\n"A, B",hello\nC,world');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "A, B", Note: "hello" });
    expect(rows[1]).toEqual({ Name: "C", Note: "world" });
  });

  it("strips BOM", () => {
    const rows = parseCsv("\uFEFFDate,Amount\n1,2");
    expect(rows[0]?.Date).toBe("1");
  });
});
