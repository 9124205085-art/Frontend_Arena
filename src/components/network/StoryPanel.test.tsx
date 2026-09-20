import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import StoryPanel from "./StoryPanel";
import { useLifeStore } from "../../store";
import type { Receipt } from "../../data/types";

const receipt: Receipt = {
  id: "m1",
  type: "music",
  timestamp: "2020-01-01T12:00:00",
  title: "Midnight City",
  description: "Played on Spotify",
  tags: ["music"],
  relatedIds: [],
  source: "spotify",
};

describe("StoryPanel", () => {
  beforeEach(() => {
    useLifeStore.setState({
      selectedId: "m1",
      selectedEdge: null,
      selectedPlace: null,
      receipts: [receipt],
      edgesByNode: new Map(),
      edges: [],
      locationStats: [],
      storyPlaying: false,
    });
  });

  it("names the dialog and closes on Escape", () => {
    render(
      <MemoryRouter>
        <StoryPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole("dialog", { name: /midnight city/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveAccessibleName("Close");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useLifeStore.getState().selectedId).toBeNull();
    expect(useLifeStore.getState().selectedPlace).toBeNull();
    expect(useLifeStore.getState().selectedEdge).toBeNull();
  });
});
