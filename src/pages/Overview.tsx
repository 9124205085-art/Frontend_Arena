import { useLifeStore } from "../store";
import { applyPatternTrace, startPatternNarration } from "../hooks/storyPlayback";
import MemoryNetwork from "../components/network/MemoryNetwork";
import { CountUp } from "../components/ui";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function Overview() {
  const edgesByNode = useLifeStore((s) => s.edgesByNode);
  const connected = edgesByNode.size;
  const stats = useLifeStore((s) => s.overview);
  const discoveries = useLifeStore((s) => s.patterns).slice(0, 3);
  const clearLenses = useLifeStore((s) => s.clearLenses);
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const reduced = usePrefersReducedMotion();

  const toNetwork = () =>
    document.getElementById("network-anchor")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

  if (!stats) return null;

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent sm:tracking-[0.36em]">Home</p>
      <h1 className="mt-3 text-[clamp(1.85rem,8vw,3.6rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
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
            const ids: string[] = [];
            for (const id of edgesByNode.keys()) {
              ids.push(id);
              if (ids.length >= 400) break;
            }
            applyTrace(ids);
            toNetwork();
          }}
        />
      </div>

      <div id="network-anchor">
        <MemoryNetwork hint="Click any moment to explore its connections." />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Discoveries</h2>
        <p className="mt-1 text-sm text-mute">Trace the pattern, or hear the archive explain it.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {discoveries.map((p) => (
            <article key={p.id} className="glass-card glow-border rounded-3xl p-5 text-left">
              <p className="text-2xl">{p.icon}</p>
              <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{p.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    applyPatternTrace(p.id);
                    toNetwork();
                  }}
                  className="min-h-11 rounded-full bg-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                >
                  {p.action}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    startPatternNarration(p.id);
                    toNetwork();
                  }}
                  className="min-h-11 rounded-full border border-accent/40 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
                >
                  🔊 Explain this
                </button>
              </div>
            </article>
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
    <button type="button" onClick={onClick} className="glass-card min-h-[7.5rem] rounded-2xl p-4 text-left transition hover:border-accent/40 sm:p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mute">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      <p className="mt-1 text-sm text-mute">{hint}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Explore →</p>
    </button>
  );
}
