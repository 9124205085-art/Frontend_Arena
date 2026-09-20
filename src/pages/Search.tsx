import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { neighborIds, useLifeStore } from "../store";
import { searchReceipts } from "../utils/analyzeData";
import { SUGGESTED_SEARCHES, TYPE_LABEL } from "../utils/constants";
import MomentCard from "../components/MomentCard";
import { EmptyState, PageIntro } from "../components/ui";

export default function SearchPage() {
  const navigate = useNavigate();
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const query = useLifeStore((s) => s.query);
  const setQuery = useLifeStore((s) => s.setQuery);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const [active, setActive] = useState(0);

  const results = useMemo(() => (query.trim() ? searchReceipts(query, receipts, 40) : []), [query, receipts]);
  const grouped = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const r of results) {
      const list = m.get(r.type) ?? [];
      list.push(r);
      m.set(r.type, list);
    }
    return [...m.entries()];
  }, [results]);

  function openResult(id: string) {
    applyTrace([id, ...neighborIds(id, edges)]);
    navigate("/network");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <PageIntro kicker="Curiosity" title="What are you curious about?" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setQuery("");
            setActive(0);
            return;
          }
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(results.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const hit = results[active];
            if (hit) openResult(hit.id);
          }
        }}
        placeholder="Search your life…"
        className="mt-7 w-full rounded-2xl border border-white/[0.08] bg-[#121218] px-5 py-4 text-lg outline-none transition focus:border-accent/50 focus:shadow-[0_0_0_4px_rgba(124,107,255,0.12)]"
        aria-label="Search your life"
        aria-controls="search-results"
        aria-activedescendant={results[active] ? `result-${results[active].id}` : undefined}
        role="combobox"
        aria-expanded={Boolean(query.trim())}
        aria-autocomplete="list"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_SEARCHES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-mute transition hover:border-accent/40 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm text-mute" role="status" aria-live="polite">
        {query.trim()
          ? `${results.length.toLocaleString("en-IN")} matching traces (capped sample)`
          : `The archive holds ${receipts.length.toLocaleString("en-IN")} official records. Search to browse them.`}
      </p>
      {!query.trim() ? (
        <EmptyState title="Ask the dataset something" body="Results are filtered from the official household, Spotify, and India archives — not from invented receipts." />
      ) : grouped.length === 0 ? (
        <EmptyState title="Nothing matched" body="Try a place, a song, a time of day — or one of the suggested questions." />
      ) : (
        <div id="search-results" className="mt-6 space-y-8" role="listbox" aria-label="Search results">
          {grouped.map(([type, items]) => (
            <section key={type}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-mute">
                {TYPE_LABEL[type as keyof typeof TYPE_LABEL]}
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.slice(0, 8).map((r) => (
                  <div key={r.id} id={`result-${r.id}`} role="option" aria-selected={results[active]?.id === r.id}>
                    <MomentCard
                      receipt={r}
                      onOpen={() => openResult(r.id)}
                      connections={neighborIds(r.id, edges).length}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
