import { describe, expect, it } from "vitest";
import { safeUrl, sanitizeText } from "../lib/sanitize";

describe("sanitizeText", () => {
  it("strips control characters and trims", () => {
    expect(sanitizeText("  hello\u0000 world  ")).toBe("hello world");
  });

  it("returns empty for non-strings", () => {
    expect(sanitizeText(12)).toBe("");
    expect(sanitizeText(null)).toBe("");
  });

  it("caps length", () => {
    expect(sanitizeText("abcdefghij", 4)).toBe("abcd");
  });
});

describe("safeUrl", () => {
  it("allows http and https", () => {
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeUrl("http://localhost:5173")).toMatch(/^http:\/\/localhost/);
  });

  it("rejects javascript and other protocols", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,hi")).toBeNull();
    expect(safeUrl("/relative")).toBeNull();
  });
});
