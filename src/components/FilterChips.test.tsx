import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("has an accessible name and filters to one category", async () => {
    const user = userEvent.setup();
    render(<FilterChips />);
    expect(screen.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /music/i }));
    expect(useLifeStore.getState().activeTypes).toEqual(["music"]);
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    expect(useLifeStore.getState().activeTypes).toEqual(["music", "place"]);
  });
});
