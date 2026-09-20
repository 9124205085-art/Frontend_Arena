import { useMemo } from "react";
import { useLifeStore } from "../store";
import { getConnections, searchReceipts } from "../utils/analyzeData";
import { SUGGESTED_SEARCHES, TYPE_LABEL } from "../utils/constants";
import MomentCard from "../components/MomentCard";
import { EmptyState, PageIntro } from "../components/ui";

export default function SearchPage() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const query = useLifeStore((s) => s.query);
  const setQuery = useLifeStore((s) => s.setQuery);
  const select = useLifeStore((s) => s.select);

  const results = useMemo(() => (query.trim() ? searchReceipts(query, receipts) : []), [query, receipts]);
  const grouped = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const r of results) {
      const list = m.get(r.type) ?? [];
      list.push(r);
      m.set(r.type, list);
    }
    return [...m.entries()];
  }, [results]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <PageIntro kicker="Curiosity" title="What are you curious about?" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your life…"
        className="mt-7 w-full rounded-2xl border border-white/[0.08] bg-[#121218] px-5 py-4 text-lg outline-none transition focus:border-accent/50 focus:shadow-[0_0_0_4px_rgba(124,107,255,0.12)]"
        aria-label="Search your life"
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
      <p className="mt-6 text-sm text-mute">
        {query.trim()
          ? `${results.length.toLocaleString("en-IN")} matching traces`
          : `The archive holds ${receipts.length.toLocaleString("en-IN")} official records. Search to browse them.`}
      </p>
      {!query.trim() ? (
        <EmptyState title="Ask the dataset something" body="Results are filtered from the official household, Spotify, and India archives — not from invented receipts." />
      ) : grouped.length === 0 ? (
        <EmptyState title="Nothing matched" body="Try a place, a song, a time of day — or one of the suggested questions." />
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([type, items]) => (
            <section key={type}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-mute">
                {TYPE_LABEL[type as keyof typeof TYPE_LABEL]}
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.slice(0, 8).map((r) => (
                  <MomentCard
                    key={r.id}
                    receipt={r}
                    onOpen={() => select(r.id)}
                    connections={getConnections(r.id, edges).length}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
