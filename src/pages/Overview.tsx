import { Link } from "react-router-dom";
import { useLifeStore } from "../store";
import { getCategoryStats, getMostActivePeriods, getOverview } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay, formatHour } from "../utils/format";
import FilterChips from "../components/FilterChips";

export default function Overview() {
  const receipts = useLifeStore((s) => s.receipts);
  const stats = getOverview(receipts);
  const cats = getCategoryStats(receipts);
  const periods = getMostActivePeriods(receipts, 16);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Archive</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Your digital life</h1>
      <p className="mt-2 text-mute">
        {stats.total} moments. {stats.categories} categories. Countless connections.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total moments" value={String(stats.total)} hint="Every receipt in the archive" />
        <Kpi label="Active days" value={String(stats.activeDays)} hint="Days that left a trace" />
        <Kpi label="Places visited" value={String(stats.places)} hint="Named locations in the data" />
        <Kpi
          label="Most active time"
          value={formatHour(stats.peakHour)}
          hint={`${stats.peakCount} receipts in that hour`}
        />
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Life Pulse</h2>
            <p className="mt-1 text-sm text-mute">Not a chart — a heartbeat. Hover a node to see what that day held.</p>
          </div>
          <FilterChips />
        </div>
        <LifePulse periods={periods} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">What the mix is saying</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {cats.slice(0, 6).map((c) => (
            <div key={c.type} className="rounded-2xl border border-white/[0.08] bg-[#121218] p-4">
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: TYPE_COLOR[c.type] }}>
                {c.label}
              </p>
              <p className="mt-2 text-3xl font-bold">{c.count}</p>
              <p className="mt-1 text-sm text-mute">
                {Math.round((c.count / stats.total) * 100)}% of the remembered life
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121218] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mute">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-mute">{hint}</p>
    </div>
  );
}

function LifePulse({
  periods,
}: {
  periods: ReturnType<typeof getMostActivePeriods>;
}) {
  const max = Math.max(1, ...periods.map((p) => p.count));
  return (
    <div className="mt-6 overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-6">
      <div className="flex min-w-[640px] items-end gap-3">
        {periods.map((p) => (
          <Link
            key={p.date}
            to={`/journey?day=${p.date}`}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div
              className="w-full rounded-full bg-accent/80 transition group-hover:bg-accent"
              style={{ height: `${24 + (p.count / max) * 120}px` }}
            />
            <p className="mt-2 text-[10px] text-mute">{p.date.slice(5)}</p>
            <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden w-48 -translate-x-1/2 -translate-y-full rounded-xl border border-white/[0.08] bg-[#121218] p-3 text-left shadow-glow group-hover:block">
              <p className="text-xs font-semibold">{formatDay(p.date)}</p>
              <p className="text-[11px] text-mute">{p.count} moments</p>
              <ul className="mt-2 space-y-1 text-[11px] text-mute">
                {Object.entries(p.byType).map(([t, n]) => (
                  <li key={t} style={{ color: TYPE_COLOR[t as keyof typeof TYPE_COLOR] }}>
                    {TYPE_LABEL[t as keyof typeof TYPE_LABEL]} · {n}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
