import { useNavigate } from "react-router-dom";
import { useLifeStore } from "../store";
import { getPatternTraceIds, getPatterns } from "../utils/analyzeData";

export default function Discoveries() {
  const navigate = useNavigate();
  const receipts = useLifeStore((s) => s.receipts);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const setHourLens = useLifeStore((s) => s.setHourLens);
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);
  const patterns = getPatterns(receipts);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Discoveries</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Patterns we can trace</h1>
      <p className="mt-2 text-mute">Counted from the official records. Each one opens the network on those moments.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {patterns.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (p.id === "explorer") {
                setNetworkMode("places");
                navigate("/network");
                return;
              }
              if (p.id === "night-owl") setHourLens("night");
              if (p.id === "rituals") setHourLens("evening");
              applyTrace(getPatternTraceIds(receipts, p.id));
              navigate("/network");
            }}
            className="glass-card glow-border rounded-3xl p-6 text-left transition hover:-translate-y-0.5"
          >
            <p className="text-2xl">{p.icon}</p>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-2 leading-relaxed text-mute">{p.body}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">{p.detail}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white">{p.action}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
