import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import FilterChips from "./FilterChips";
import { useLifeStore } from "../store";

describe("FilterChips", () => {
  beforeEach(() => {
    useLifeStore.setState({
      presentTypes: ["music", "place"],
      activeTypes: ["music", "place"],
    });
  });

  it("has an accessible name and filters to one category", () => {
    render(<FilterChips />);
    expect(screen.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /music/i }));
    expect(useLifeStore.getState().activeTypes).toEqual(["music"]);
  });
});
