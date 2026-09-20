import { RECEIPT_TYPES } from "../data/types";
import { TYPE_COLOR, TYPE_LABEL } from "../lib/theme";
import { useLifeStore } from "../store";

export default function SearchFilterBar() {
  const query = useLifeStore((s) => s.query);
  const setQuery = useLifeStore((s) => s.setQuery);
  const activeTypes = useLifeStore((s) => s.activeTypes);
  const toggleType = useLifeStore((s) => s.toggleType);
  const setTypes = useLifeStore((s) => s.setTypes);
  const allOn = activeTypes.length === RECEIPT_TYPES.length;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.6rem] z-40 px-4 md:top-[5.2rem] md:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Search receipts</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a song, city, train, note…"
              className="w-full rounded-full border border-black/15 bg-black/10 px-4 py-2 font-sans text-sm outline-none placeholder:opacity-40"
            />
          </label>
          <button
            type="button"
            onClick={() => setTypes([...RECEIPT_TYPES])}
            className="rounded-full border border-black/15 px-3 py-2 text-[10px] uppercase tracking-[0.16em] opacity-70 hover:opacity-100"
          >
            Reset
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {RECEIPT_TYPES.map((t) => {
            const on = allOn || activeTypes.includes(t);
            const solo = !allOn && activeTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                style={{
                  background: solo || allOn ? TYPE_COLOR[t] : "transparent",
                  color: solo || allOn ? "#111827" : "inherit",
                  borderColor: "currentColor",
                  opacity: on ? 1 : 0.35,
                }}
              >
                {TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
