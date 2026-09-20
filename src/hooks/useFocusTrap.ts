import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getAttribute("aria-hidden") !== "true");
}

/**
 * Move focus into `ref` while `active`, cycle Tab/Shift+Tab inside it,
 * handle Escape, and restore the previously focused element on close.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  const previousRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      const previous = previousRef.current;
      previousRef.current = null;
      if (previous && document.contains(previous)) previous.focus();
      return;
    }

    const root = ref.current;
    if (!root) return;
    if (!previousRef.current && document.activeElement instanceof HTMLElement) {
      previousRef.current = document.activeElement;
    }
    if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
    const first = getFocusable(root)[0] ?? root;
    first.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable(root);
      if (!items.length) {
        e.preventDefault();
        root.focus();
        return;
      }
      const start = items[0];
      const end = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === start || current === root)) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && current === end) {
        e.preventDefault();
        start.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [active, onEscape, ref]);
}
