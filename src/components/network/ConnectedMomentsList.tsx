import { useEffect, useRef, useState } from "react";

export type ConnectedListItem = {
  id: string;
  title: string;
  typeLabel: string;
  icon: string;
};

export default function ConnectedMomentsList({
  items,
  selectedId,
  onSelect,
  heading,
  hint = "Keyboard list. Arrow keys move, Enter or Space opens the story.",
  onReset,
}: {
  items: ConnectedListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  heading?: string;
  hint?: string;
  onReset?: () => void;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const idx = items.findIndex((item) => item.id === selectedId);
    if (idx >= 0) setActive(idx);
  }, [items, selectedId]);

  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [active, items.length]);

  function focusAt(index: number) {
    if (!items.length) return;
    const next = (index + items.length) % items.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  const title = heading ?? `${items.length} connected moments in this view`;

  return (
    <section className="mt-4" aria-labelledby="graph-list-title">
      <h3 id="graph-list-title" className="text-sm font-semibold">
        {title}
      </h3>
      <p className="mt-1 text-xs text-mute">{hint}</p>
      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-white/[0.08] px-4 py-6 text-center">
          <p className="text-sm text-mute" role="status">
            No connected moments in this view.
          </p>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="mt-3 min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white"
            >
              Reset view
            </button>
          )}
        </div>
      ) : (
        <ul
          className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-white/[0.08] p-2"
          role="listbox"
          aria-labelledby="graph-list-title"
        >
          {items.map((item, i) => (
            <li key={item.id} role="presentation">
              <button
                id={`graph-option-${item.id}`}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={selectedId === item.id}
                tabIndex={i === active ? 0 : -1}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focusAt(i + 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    focusAt(i - 1);
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    focusAt(0);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    focusAt(items.length - 1);
                  }
                }}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  selectedId === item.id
                    ? "bg-accent/25 text-white ring-1 ring-accent"
                    : "text-mute hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="shrink-0 text-xs uppercase tracking-wider">{item.typeLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
