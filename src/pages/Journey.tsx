import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLifeStore } from "../store";
import { getClusters, getConnections } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay } from "../utils/format";
import FilterChips from "../components/FilterChips";
import MomentCard from "../components/MomentCard";
import { EmptyState, PageIntro } from "../components/ui";
import type { ReceiptType } from "../data/types";

export default function Journey() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const types = useLifeStore((s) => s.activeTypes);
  const query = useLifeStore((s) => s.query);
  const select = useLifeStore((s) => s.select);
  const [params] = useSearchParams();
  const day = params.get("day");

  const visible = useMemo(
    () =>
      receipts.filter((r) => types.includes(r.type)).filter((r) => {
        if (!query) return true;
        return `${r.title} ${r.description} ${r.tags.join(" ")} ${r.location || ""}`.toLowerCase().includes(query.toLowerCase());
      }),
    [receipts, types, query],
  );

  const clusters = useMemo(() => getClusters(visible, 2, 24), [visible]);
  const focusFromList = clusters.find((c) => c.date === day) ?? clusters[0];
  const focus = useMemo(() => {
    if (!day) return focusFromList;
    if (focusFromList?.date === day) return focusFromList;
    const items = visible.filter((r) => r.timestamp.slice(0, 10) === day);
    if (!items.length) return focusFromList;
    return {
      id: `day-${day}`,
      date: day,
      receipts: items.slice(0, 40),
      types: [...new Set(items.map((i) => i.type))],
      total: items.length,
    };
  }, [day, focusFromList, visible]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PageIntro kicker="Journey" title="Moments, clustered">
        Not January then February. Days that gathered enough traces to become a scene.
      </PageIntro>
      <div className="mt-7">
        <FilterChips />
      </div>

      {!focus && (
        <EmptyState
          title="No scenes in this filter"
          body="Widen the categories or clear search to let the clusters come back."
        />
      )}

      {focus && (
        <section className="mt-10 rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-mute">Moments around</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{formatDay(focus.date)}</h2>
          <p className="text-sm text-mute">
            The dataset shows {focus.total.toLocaleString("en-IN")} records on this date
            {focus.types.length > 1 ? `, across ${focus.types.map((t) => TYPE_LABEL[t]).join(", ")}` : ""}.
          </p>
          <Constellation receipts={focus.receipts.slice(0, 14)} onOpen={select} />
        </section>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusters.slice(0, 18).map((c) => (
          <div key={c.id} className="glass-card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{formatDay(c.date)}</p>
            <p className="mt-1 text-lg font-semibold">{c.total.toLocaleString("en-IN")} records this day</p>
            <p className="mt-1 text-sm text-mute">{c.types.map((t) => TYPE_LABEL[t]).join(" · ")}</p>
            <div className="mt-3 space-y-2">
              {c.receipts.slice(0, 3).map((r) => (
                <MomentCard
                  key={r.id}
                  receipt={r}
                  onOpen={() => select(r.id)}
                  connections={getConnections(r.id, edges).length}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Constellation({
  receipts,
  onOpen,
}: {
  receipts: { id: string; title: string; type: ReceiptType }[];
  onOpen: (id: string) => void;
}) {
  const n = receipts.length;
  const pts = receipts.map((r, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { ...r, x: 50 + Math.cos(a) * 36, y: 50 + Math.sin(a) * 36 };
  });

  return (
    <div className="relative mx-auto mt-8 h-72 max-w-lg">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {pts.map((p, i) => {
          const next = pts[(i + 1) % pts.length];
          return (
            <line
              key={`${p.id}-line`}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke="#7C6BFF"
              strokeOpacity="0.22"
              strokeWidth="0.35"
            />
          );
        })}
        {pts.map((p) => (
          <line key={`${p.id}-spoke`} x1="50" y1="50" x2={p.x} y2={p.y} stroke="#ffffff" strokeOpacity="0.08" strokeWidth="0.25" />
        ))}
      </svg>
      {pts.map((r) => (
        <button
          key={r.id}
          type="button"
          title={r.title}
          aria-label={r.title}
          onClick={() => onOpen(r.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink shadow-glow transition hover:scale-110"
          style={{ left: `${r.x}%`, top: `${r.y}%`, background: TYPE_COLOR[r.type] }}
        >
          {TYPE_LABEL[r.type]}
        </button>
      ))}
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-glow" />
    </div>
  );
}
