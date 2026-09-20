import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useLifeStore } from "../store";
import { getCategoryStats, getMostActivePeriods, getOverview } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay, formatHour } from "../utils/format";
import FilterChips from "../components/FilterChips";
import { CountUp, EmptyState, PageIntro } from "../components/ui";

export default function Overview() {
  const receipts = useLifeStore((s) => s.receipts);
  const types = useLifeStore((s) => s.activeTypes);
  const visible = useMemo(() => receipts.filter((r) => types.includes(r.type)), [receipts, types]);
  const stats = getOverview(receipts);
  const cats = getCategoryStats(visible);
  const periods = getMostActivePeriods(visible, 16).slice().sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PageIntro kicker="Archive" title="Your digital life">
        {stats.total} moments. {stats.categories} categories. Countless connections.
      </PageIntro>

      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total moments" value={stats.total} hint="Every receipt in the archive" numeric />
        <Kpi label="Active days" value={stats.activeDays} hint="Days that left a trace" numeric />
        <Kpi label="Places visited" value={stats.places} hint="Named locations in the data" numeric />
        <Kpi label="Most active time" value={formatHour(stats.peakHour)} hint={`${stats.peakCount} receipts in that hour`} />
      </div>

      <section className="mt-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Life Pulse</h2>
            <p className="mt-1 text-sm text-mute">Not a chart — a heartbeat. Hover a node to see what that day held.</p>
          </div>
          <FilterChips />
        </div>
        <LifePulse periods={periods} />
        {periods.length === 0 && (
          <EmptyState title="The pulse went still" body="Turn a category back on to see the days that still hold traces." />
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">What the mix is saying</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cats.slice(0, 6).map((c, i) => (
            <motion.div
              key={c.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5"
            >
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: TYPE_COLOR[c.type] }}>
                {c.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{c.count}</p>
              <p className="mt-1 text-sm text-mute">
                {Math.round((c.count / Math.max(1, visible.length)) * 100)}% of the remembered life
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  numeric,
}: {
  label: string;
  value: string | number;
  hint: string;
  numeric?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mute">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
        {numeric && typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
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
    <div className="relative mt-6 overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-6">
      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
      <div className="relative flex min-w-[720px] items-end gap-2">
        {periods.map((p) => {
          const h = 28 + (p.count / max) * 132;
          const topType = Object.entries(p.byType).sort((a, b) => b[1] - a[1])[0]?.[0];
          const color = topType ? TYPE_COLOR[topType as keyof typeof TYPE_COLOR] : "#7C6BFF";
          return (
            <Link
              key={p.date}
              to={`/journey?day=${p.date}`}
              className="group relative flex flex-1 flex-col items-center"
            >
              <span
                className="mb-2 h-2 w-2 rounded-full opacity-80 shadow-[0_0_12px_currentColor] transition group-hover:scale-150"
                style={{ color, background: color }}
              />
              <div
                className="w-[70%] rounded-full transition group-hover:brightness-125"
                style={{
                  height: `${h}px`,
                  background: `linear-gradient(180deg, ${color}, rgba(124,107,255,0.25))`,
                  boxShadow: `0 0 22px ${color}55`,
                }}
              />
              <p className="mt-2 text-[10px] tabular-nums text-mute">{p.date.slice(5)}</p>
              <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden w-52 -translate-x-1/2 -translate-y-full rounded-2xl border border-white/[0.08] bg-[#121218]/95 p-3 text-left shadow-glow backdrop-blur-xl group-hover:block group-focus-visible:block">
                <p className="text-xs font-semibold">{formatDay(p.date)}</p>
                <p className="text-[11px] text-mute">{p.count} moments gathered here</p>
                <ul className="mt-2 space-y-1 text-[11px] text-mute">
                  {Object.entries(p.byType).map(([t, n]) => (
                    <li key={t} style={{ color: TYPE_COLOR[t as keyof typeof TYPE_COLOR] }}>
                      {TYPE_LABEL[t as keyof typeof TYPE_LABEL]} · {n}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
