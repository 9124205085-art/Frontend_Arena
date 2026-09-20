import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLifeStore } from "../store";
import { getClusters } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay } from "../utils/format";
import FilterChips from "../components/FilterChips";
import MomentCard from "../components/MomentCard";
import { getConnections } from "../utils/analyzeData";

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

  const clusters = getClusters(visible, 2);
  const focus = clusters.find((c) => c.date === day) ?? clusters[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Journey</p>
      <h1 className="mt-2 text-4xl font-extrabold">Moments, clustered</h1>
      <p className="mt-2 max-w-2xl text-mute">
        Not January then February. Days that gathered enough traces to become a scene.
      </p>
      <div className="mt-6">
        <FilterChips />
      </div>

      {focus && (
        <section className="mt-10 rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-mute">Moments around</p>
          <h2 className="mt-1 text-2xl font-bold">{formatDay(focus.date)}</h2>
          <p className="text-sm text-mute">{focus.receipts.length} traces that share a calendar square</p>
          <Constellation receipts={focus.receipts} onOpen={select} />
        </section>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusters.slice(0, 18).map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/[0.08] bg-[#121218] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">{formatDay(c.date)}</p>
            <p className="mt-1 text-lg font-semibold">{c.receipts.length} connected traces</p>
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
  receipts: { id: string; title: string; type: keyof typeof TYPE_COLOR }[];
  onOpen: (id: string) => void;
}) {
  const n = receipts.length;
  return (
    <div className="relative mx-auto mt-8 h-64 max-w-lg">
      {receipts.map((r, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * 38;
        const y = 50 + Math.sin(a) * 38;
        return (
          <button
            key={r.id}
            type="button"
            title={r.title}
            onClick={() => onOpen(r.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink"
            style={{ left: `${x}%`, top: `${y}%`, background: TYPE_COLOR[r.type] }}
          >
            {TYPE_LABEL[r.type]}
          </button>
        );
      })}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-glow" />
    </div>
  );
}
