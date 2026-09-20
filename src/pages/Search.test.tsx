import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SearchPage from "./Search";
import { useLifeStore } from "../store";
import type { Receipt } from "../data/types";

const receipts: Receipt[] = [
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
    title: "Cafe visit",
    description: "A morning stop",
    location: "Chennai",
    tags: ["place"],
    relatedIds: [],
    source: "india",
  },
];

describe("Search keyboard", () => {
  beforeEach(() => {
    useLifeStore.setState({
      receipts,
      query: "",
      receiptById: new Map(receipts.map((r) => [r.id, r])),
      edgesByNode: new Map(),
    });
  });

  it("labels the combobox, moves with arrows, and clears on Escape", () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );
    const input = screen.getByRole("combobox", { name: "Search your life" });
    fireEvent.change(input, { target: { value: "midnight" } });
    expect(screen.getByRole("status")).toHaveTextContent(/matching traces/i);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /midnight city/i })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(useLifeStore.getState().query).toBe("");
  });
});
