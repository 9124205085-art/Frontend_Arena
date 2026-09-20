import { useNavigate } from "react-router-dom";
import { useLifeStore } from "../store";
import { applyPatternTrace, startChapterNarration, startPatternNarration } from "../hooks/storyPlayback";

export default function Discoveries() {
  const navigate = useNavigate();
  const chapters = useLifeStore((s) => s.chapters);
  const patterns = useLifeStore((s) => s.patterns);
  const applyTrace = useLifeStore((s) => s.applyTrace);

  function tracePattern(id: string) {
    applyPatternTrace(id);
    navigate("/network");
  }

  function explainPattern(id: string) {
    startPatternNarration(id);
    navigate("/network");
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:tracking-[0.28em]">Discoveries</p>
      <h1 className="mt-2 text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-tight">Patterns we can trace</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
        Counted from the official records. Show them on the network, or hear the archive explain them.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {patterns.map((p) => (
          <article key={p.id} className="glass-card glow-border rounded-3xl p-6 text-left">
            <p className="text-2xl" aria-hidden>
              {p.icon}
            </p>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-2 leading-relaxed text-mute">{p.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => tracePattern(p.id)}
                className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {p.action}
              </button>
              <button
                type="button"
                onClick={() => explainPattern(p.id)}
                className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/80 transition hover:border-accent/50 hover:text-white"
              >
                Explain this
              </button>
            </div>
          </article>
        ))}
      </div>

      {chapters.length > 0 && (
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Chapters</p>
          <h2 className="mt-2 text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-tight">Three archives, three stories</h2>
          <p className="mt-2 text-base text-mute">Generated from the household, Spotify, and India files. Nothing here is invented.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {chapters.map((ch) => (
              <article key={ch.id} className="glass-card rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-mute">{ch.kicker}</p>
                <h3 className="mt-2 text-xl font-bold">{ch.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{ch.description}</p>
                <p className="mt-3 text-xs text-mute">
                  {ch.start.slice(0, 10)} → {ch.end.slice(0, 10)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      applyTrace(ch.receiptIds);
                      navigate("/network");
                    }}
                    className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Show on network
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startChapterNarration(ch);
                      navigate("/network");
                    }}
                    className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/80 transition hover:border-accent/50 hover:text-white"
                  >
                    Tell this chapter
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
