import { useState } from "react";
import { useLifeStore } from "../store";
import { getLocationStats } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { hashId } from "../utils/format";
import { EmptyState, PageIntro } from "../components/ui";

export default function Places() {
  const receipts = useLifeStore((s) => s.receipts);
  const select = useLifeStore((s) => s.select);
  const locs = getLocationStats(receipts);
  const visits = locs.reduce((s, l) => s + l.count, 0);
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <PageIntro kicker="Geography of a life" title="Places">
        {locs.length} locations · {visits} visits — an abstract constellation, not a fake map.
      </PageIntro>

      {locs.length === 0 ? (
        <EmptyState title="No named places" body="This archive’s traces didn’t carry locations." />
      ) : (
        <>
          <div className="relative mt-10 h-[420px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0D0D12]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
              {locs.slice(0, 12).map((l, i) => {
                const next = locs[(i + 3) % Math.min(12, locs.length)];
                if (!next) return null;
                const a = point(l.location);
                const b = point(next.location);
                return (
                  <line
                    key={`${l.location}-${next.location}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#22D3EE"
                    strokeOpacity="0.12"
                    strokeWidth="0.2"
                  />
                );
              })}
            </svg>
            {locs.slice(0, 24).map((l, i) => {
              const p = point(l.location);
              const size = 10 + Math.min(28, l.count * 2);
              const on = hover === l.location;
              return (
                <button
                  key={l.location}
                  type="button"
                  title={`${l.location} · ${l.count} visits`}
                  onMouseEnter={() => setHover(l.location)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(l.location)}
                  onBlur={() => setHover(null)}
                  onClick={() => {
                    const first = l.ids[0];
                    if (first) select(first);
                  }}
                  aria-label={`${l.location}, ${l.count} visits`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/80 text-ink shadow-glow transition hover:scale-110"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: size,
                    height: size,
                    opacity: on ? 1 : 0.55 + (i % 5) * 0.08,
                  }}
                />
              );
            })}
            {hover && (
              <p className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/[0.08] bg-[#121218]/90 px-3 py-1 text-xs">
                {hover}
              </p>
            )}
          </div>

          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {locs.slice(0, 12).map((l) => (
              <li key={l.location} className="glass-card rounded-2xl p-4">
                <h2 className="font-semibold tracking-tight">{l.location}</h2>
                <p className="text-sm text-mute">{l.count} connected receipts</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider">
                  {Object.entries(l.byType).map(([t, n]) => (
                    <span key={t} style={{ color: TYPE_COLOR[t as keyof typeof TYPE_COLOR] }}>
                      {TYPE_LABEL[t as keyof typeof TYPE_LABEL]} {n}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function point(location: string) {
  const h = hashId(location);
  return { x: 10 + (h % 80), y: 14 + ((h >> 8) % 68) };
}
