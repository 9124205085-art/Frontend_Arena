import { useLifeStore } from "../store";
import { getHourlyActivity, getPatterns } from "../utils/analyzeData";
import { formatHour } from "../utils/format";

export default function Patterns() {
  const receipts = useLifeStore((s) => s.receipts);
  const patterns = getPatterns(receipts);
  const hours = getHourlyActivity(receipts);
  const max = Math.max(1, ...hours.map((h) => h.count));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Discovery</p>
      <h1 className="mt-2 text-4xl font-extrabold">Patterns we found</h1>
      <p className="mt-2 text-mute">The data reveals things you may not have noticed.</p>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Activity by hour</p>
        <div className="mt-4 flex h-36 min-w-[640px] items-end gap-1">
          {hours.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-sm bg-accent/80"
                style={{ height: `${(h.count / max) * 100}%` }}
                title={`${formatHour(h.hour)} · ${h.count}`}
              />
              {h.hour % 3 === 0 && <span className="text-[9px] text-mute">{h.hour}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {patterns.map((p) => (
          <article key={p.id} className="rounded-3xl border border-white/[0.08] bg-[#121218] p-6">
            <p className="text-2xl">{p.icon}</p>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-2 leading-relaxed text-mute">{p.body}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">{p.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
