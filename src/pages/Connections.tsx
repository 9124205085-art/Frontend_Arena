import { useMemo, useState } from "react";
import { useLifeStore, neighborIds } from "../store";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { hashId } from "../utils/format";
import FilterChips from "../components/FilterChips";
import { EmptyState, PageIntro } from "../components/ui";

export default function Connections() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const types = useLifeStore((s) => s.activeTypes);
  const selectedId = useLifeStore((s) => s.selectedId);
  const select = useLifeStore((s) => s.select);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const nodes = useMemo(
    () => receipts.filter((r) => types.includes(r.type)).slice(0, 72),
    [receipts, types],
  );
  const ids = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const visEdges = useMemo(
    () => edges.filter((e) => ids.has(e.a) && ids.has(e.b)).slice(0, 90),
    [edges, ids],
  );
  const focusId = selectedId ?? hoverId;
  const neigh = focusId ? new Set(neighborIds(focusId, edges)) : null;

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
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PageIntro kicker="The important page" title="Connections">
        Some moments only make sense when you see them together.
      </PageIntro>
      <div className="mt-7">
        <FilterChips />
      </div>

      {nodes.length === 0 ? (
        <EmptyState title="The graph went quiet" body="Turn a category back on to watch the threads reappear." />
      ) : (
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0D0D12]">
          <svg
            viewBox="0 0 100 100"
            className="h-[min(70vh,640px)] w-full"
            onClick={() => select(null)}
            role="img"
            aria-label="Knowledge graph of connected receipts"
          >
            <defs>
              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {visEdges.map((e) => {
              const a = pos.get(e.a);
              const b = pos.get(e.b);
              if (!a || !b) return null;
              const hot = !focusId || e.a === focusId || e.b === focusId;
              return (
                <line
                  key={`${e.a}-${e.b}-${e.reason}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hot ? "#8B7CFF" : "#ffffff"}
                  strokeOpacity={hot ? 0.62 : 0.045}
                  strokeWidth={hot ? 0.32 : 0.1}
                  style={{ transition: "stroke-opacity 200ms ease" }}
                />
              );
            })}
            {nodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const dim = Boolean(focusId && focusId !== n.id && !neigh?.has(n.id));
              const active = focusId === n.id;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    select(n.id);
                  }}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <title>
                    {n.title} · {TYPE_LABEL[n.type]}
                  </title>
                  <circle cx={p.x} cy={p.y} r={active ? 2.4 : 1.8} fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 1.7 : 1.05}
                    fill={TYPE_COLOR[n.type]}
                    opacity={dim ? 0.12 : 1}
                    filter={active || (!dim && focusId) ? "url(#node-glow)" : undefined}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}
      {selected && (
        <p className="mt-4 text-sm text-mute">
          {selected.title} · {neigh?.size ?? 0} connected receipts · 1 selected moment
        </p>
      )}
    </div>
  );
}
