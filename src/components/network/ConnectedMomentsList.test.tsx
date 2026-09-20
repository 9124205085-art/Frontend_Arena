import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConnectedMomentsList from "./ConnectedMomentsList";

const items = [
  { id: "a", title: "Midnight City", typeLabel: "Music", icon: "🎵" },
  { id: "b", title: "Cafe visit", typeLabel: "Place", icon: "📍" },
  { id: "c", title: "Groceries", typeLabel: "Purchase", icon: "🧾" },
];

describe("ConnectedMomentsList", () => {
  it("exposes a named listbox as the keyboard alternative", () => {
    render(<ConnectedMomentsList items={items} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByRole("heading", { name: /3 connected moments in this view/i })).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveAccessibleName(/connected moments/i);
    expect(screen.getByRole("option", { name: /midnight city/i })).toBeInTheDocument();
  });

  it("moves with arrows and selects with Enter and Space", () => {
    const onSelect = vi.fn();
    render(<ConnectedMomentsList items={items} selectedId="a" onSelect={onSelect} />);
    const first = screen.getByRole("option", { name: /midnight city/i });
    const second = screen.getByRole("option", { name: /cafe visit/i });
    const last = screen.getByRole("option", { name: /groceries/i });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(second).toHaveFocus();
    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledWith("b");
    fireEvent.keyDown(second, { key: " " });
    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(second, { key: "End" });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: "Home" });
    expect(first).toHaveFocus();
  });
});
