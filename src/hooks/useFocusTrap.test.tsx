import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

function Fixture() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, () => setOpen(false));
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open story
      </button>
      {open && (
        <div ref={ref} role="dialog" aria-label="Story">
          <button type="button">Close</button>
          <button type="button">Tell the story</button>
        </div>
      )}
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus into the dialog, cycles Tab, and restores on Escape", () => {
    render(<Fixture />);
    const opener = screen.getByRole("button", { name: "Open story" });
    opener.focus();
    fireEvent.click(opener);
    const close = screen.getByRole("button", { name: "Close" });
    const tell = screen.getByRole("button", { name: "Tell the story" });
    expect(close).toHaveFocus();
    tell.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(tell).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
