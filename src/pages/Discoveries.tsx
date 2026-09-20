import { useNavigate } from "react-router-dom";
import { useLifeStore } from "../store";
import { getPatternTraceIds, getPatterns } from "../utils/analyzeData";
import { startChapterNarration, startPatternNarration } from "../utils/narration";

export default function Discoveries() {
  const navigate = useNavigate();
  const receipts = useLifeStore((s) => s.receipts);
  const chapters = useLifeStore((s) => s.chapters);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const setHourLens = useLifeStore((s) => s.setHourLens);
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);
  const patterns = getPatterns(receipts);

  function tracePattern(id: string) {
    if (id === "explorer") {
      setNetworkMode("places");
      navigate("/network");
      return;
    }
    if (id === "night-owl") setHourLens("night");
    if (id === "rituals") setHourLens("evening");
    applyTrace(getPatternTraceIds(receipts, id));
    navigate("/network");
  }

  function explainPattern(id: string) {
    startPatternNarration(id);
    navigate("/network");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Discoveries</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Patterns we can trace</h1>
      <p className="mt-2 text-mute">Counted from the official records. Trace them on the network, or hear the archive explain them.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {patterns.map((p) => (
          <article key={p.id} className="glass-card glow-border rounded-3xl p-6 text-left">
            <p className="text-2xl">{p.icon}</p>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-2 leading-relaxed text-mute">{p.body}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">{p.detail}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => tracePattern(p.id)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                {p.action}
              </button>
              <button
                type="button"
                onClick={() => explainPattern(p.id)}
                className="rounded-full border border-accent/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
              >
                🔊 Explain this
              </button>
            </div>
          </article>
        ))}
      </div>

      {chapters.length > 0 && (
        <section className="mt-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Chapters</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Three archives, three stories</h2>
          <p className="mt-2 text-mute">Generated from the household, Spotify, and India files. Nothing here is invented.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {chapters.map((ch) => (
              <article key={ch.id} className="glass-card rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-mute">{ch.kicker}</p>
                <h3 className="mt-2 text-xl font-bold">{ch.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{ch.description}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-mute">
                  {ch.start.slice(0, 10)} → {ch.end.slice(0, 10)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      applyTrace(ch.receiptIds);
                      navigate("/network");
                    }}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    Show on network
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startChapterNarration(ch);
                      navigate("/network");
                    }}
                    className="rounded-full border border-accent/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
                  >
                    🔊 Tell this chapter
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
