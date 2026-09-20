import { useLifeStore } from "../store";
import { getOverview, getPatternTraceIds, getPatterns } from "../utils/analyzeData";
import MemoryNetwork from "../components/network/MemoryNetwork";
import { CountUp } from "../components/ui";

export default function Overview() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const clearLenses = useLifeStore((s) => s.clearLenses);
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);
  const setHourLens = useLifeStore((s) => s.setHourLens);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const stats = getOverview(receipts);
  const connected = new Set(edges.flatMap((e) => [e.a, e.b])).size;
  const discoveries = getPatterns(receipts).slice(0, 3);

  const toNetwork = () => document.getElementById("network-anchor")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-accent">Home</p>
      <h1 className="mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
        Your life, in receipts
      </h1>
      <p className="mt-3 max-w-xl text-mute">Small moments. Hidden connections. One story.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionStat
          label="Total moments"
          value={stats.total}
          hint="Clear filters and return to the full sample"
          onClick={() => {
            clearLenses();
            toNetwork();
          }}
        />
        <ActionStat
          label="Time span"
          value={`${stats.dateStart.slice(0, 4)}–${stats.dateEnd.slice(0, 4)}`}
          hint={`${stats.months} months in the archive`}
          onClick={() => {
            setNetworkMode("time");
            toNetwork();
          }}
        />
        <ActionStat
          label="Categories"
          value={stats.categories}
          hint="Use the filter chips on the network"
          onClick={toNetwork}
        />
        <ActionStat
          label="Connected moments"
          value={connected}
          hint="Receipts with at least one stored relationship"
          onClick={() => {
            applyTrace([...new Set(edges.flatMap((e) => [e.a, e.b]))].slice(0, 400));
            toNetwork();
          }}
        />
      </div>

      <div id="network-anchor">
        <MemoryNetwork hint="Click any moment to explore its connections." />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Discoveries</h2>
        <p className="mt-1 text-sm text-mute">Click to highlight the matching records on the network.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {discoveries.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.id === "explorer") {
                  setNetworkMode("places");
                  toNetwork();
                  return;
                }
                if (p.id === "night-owl") setHourLens("night");
                if (p.id === "rituals") setHourLens("evening");
                applyTrace(getPatternTraceIds(receipts, p.id));
                toNetwork();
              }}
              className="glass-card glow-border rounded-3xl p-5 text-left transition hover:-translate-y-0.5"
            >
              <p className="text-2xl">{p.icon}</p>
              <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{p.body}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{p.action}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionStat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="glass-card rounded-2xl p-5 text-left transition hover:border-accent/40">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mute">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      <p className="mt-1 text-sm text-mute">{hint}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Explore →</p>
    </button>
  );
}
