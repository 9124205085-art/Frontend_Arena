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
  hint = "Keyboard alternative to the canvas. Arrow keys move, Enter or Space selects.",
}: {
  items: ConnectedListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  heading?: string;
  hint?: string;
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
        <p className="mt-3 text-sm text-mute" role="status">
          No connected moments in this view.
        </p>
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
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                  selectedId === item.id ? "bg-accent/20 text-white" : "text-mute hover:text-white"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider">{item.typeLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
