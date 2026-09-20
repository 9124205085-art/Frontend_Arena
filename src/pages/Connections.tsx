import { useMemo } from "react";
import { useLifeStore } from "../store";
import { neighborIds } from "../store";
import { TYPE_COLOR } from "../utils/constants";
import { hashId } from "../utils/format";
import FilterChips from "../components/FilterChips";

export default function Connections() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const types = useLifeStore((s) => s.activeTypes);
  const selectedId = useLifeStore((s) => s.selectedId);
  const select = useLifeStore((s) => s.select);

  const nodes = useMemo(
    () => receipts.filter((r) => types.includes(r.type)).slice(0, 72),
    [receipts, types],
  );
  const ids = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const visEdges = useMemo(
    () => edges.filter((e) => ids.has(e.a) && ids.has(e.b)).slice(0, 90),
    [edges, ids],
  );
  const neigh = selectedId ? new Set(neighborIds(selectedId, edges)) : null;

  const pos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      const ring = 1 + (i % 3);
      const a = (i / nodes.length) * Math.PI * 2 + (hashId(n.id) % 12) * 0.02;
      map.set(n.id, {
        x: 50 + Math.cos(a) * (16 + ring * 10),
        y: 50 + Math.sin(a) * (16 + ring * 10),
      });
    });
    return map;
  }, [nodes]);

  const selected = receipts.find((r) => r.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">The important page</p>
      <h1 className="mt-2 text-4xl font-extrabold">Connections</h1>
      <p className="mt-2 max-w-2xl text-mute">Some moments only make sense when you see them together.</p>
      <div className="mt-6">
        <FilterChips />
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0D0D12]">
        <svg viewBox="0 0 100 100" className="h-[min(70vh,640px)] w-full">
          {visEdges.map((e) => {
            const a = pos.get(e.a);
            const b = pos.get(e.b);
            if (!a || !b) return null;
            const hot = !selectedId || e.a === selectedId || e.b === selectedId;
            return (
              <line
                key={`${e.a}-${e.b}-${e.reason}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hot ? "#7C6BFF" : "#ffffff"}
                strokeOpacity={hot ? 0.55 : 0.06}
                strokeWidth={hot ? 0.25 : 0.12}
              />
            );
          })}
          {nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const dim = selectedId && selectedId !== n.id && !neigh?.has(n.id);
            return (
              <g key={n.id} onClick={() => select(n.id)} className="cursor-pointer">
                <title>{n.title}</title>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={selectedId === n.id ? 1.6 : 1.05}
                  fill={TYPE_COLOR[n.type]}
                  opacity={dim ? 0.15 : 1}
                />
              </g>
            );
          })}
        </svg>
      </div>
      {selected && (
        <p className="mt-4 text-sm text-mute">
          {selected.title} · {neigh?.size ?? 0} connected receipts · 1 selected moment
        </p>
      )}
    </div>
  );
}
