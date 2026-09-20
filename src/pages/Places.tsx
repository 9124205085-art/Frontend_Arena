import { useLifeStore } from "../store";
import { getLocationStats } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { hashId } from "../utils/format";

export default function Places() {
  const receipts = useLifeStore((s) => s.receipts);
  const select = useLifeStore((s) => s.select);
  const locs = getLocationStats(receipts);
  const visits = locs.reduce((s, l) => s + l.count, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Geography of a life</p>
      <h1 className="mt-2 text-4xl font-extrabold">Places</h1>
      <p className="mt-2 text-mute">
        {locs.length} locations · {visits} visits — an abstract constellation, not a fake map.
      </p>

      <div className="relative mt-10 h-[420px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0D0D12]">
        {locs.slice(0, 24).map((l, i) => {
          const h = hashId(l.location);
          const x = 8 + (h % 80);
          const y = 12 + ((h >> 8) % 70);
          const size = 10 + Math.min(28, l.count * 2);
          return (
            <button
              key={l.location}
              type="button"
              title={l.location}
              onClick={() => {
                const first = l.ids[0];
                if (first) select(first);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/80 text-[10px] font-semibold text-ink shadow-glow"
              style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, opacity: 0.55 + (i % 5) * 0.08 }}
            />
          );
        })}
      </div>

      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {locs.slice(0, 12).map((l) => (
          <li key={l.location} className="rounded-2xl border border-white/[0.08] bg-[#121218] p-4">
            <h2 className="font-semibold">{l.location}</h2>
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
    </div>
  );
}
