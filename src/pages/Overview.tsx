import { Link } from "react-router-dom";
import { useLifeStore } from "../store";
import { applyPatternTrace } from "../hooks/storyPlayback";
import MemoryNetwork from "../components/network/MemoryNetwork";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function Overview() {
  const discoveries = useLifeStore((s) => s.patterns).slice(0, 3);
  const reduced = usePrefersReducedMotion();

  const toNetwork = () =>
    document.getElementById("network-anchor")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:tracking-[0.28em]">The map</p>
      <h1 className="mt-2 text-[clamp(1.85rem,7vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
        Each dot is a moment
      </h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-white/85">
        Lines show relationships. Click a moment to explore it. Follow the connections to discover a story.
      </p>

      <div id="network-anchor">
        <MemoryNetwork hint="" />
      </div>

      {discoveries.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">Trace a pattern</h2>
            <Link to="/discoveries" className="text-sm font-semibold text-accent transition hover:text-white">
              All discoveries →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {discoveries.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    applyPatternTrace(p.id);
                    toNetwork();
                  }}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#121218]/80 px-4 py-3 text-left transition hover:border-accent/50 hover:bg-[#16161f]"
                >
                  <span className="min-w-0">
                    <span className="mr-2" aria-hidden>
                      {p.icon}
                    </span>
                    <span className="font-semibold">{p.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-mute">{p.action}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent">Show →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
