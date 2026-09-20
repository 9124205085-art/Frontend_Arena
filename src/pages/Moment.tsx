import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { neighborIds, useLifeStore } from "../store";
import { buildMomentSequence, pathSpanMinutes, timeOfDayMood } from "../domain/story";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatWhen } from "../utils/format";

export default function Moment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const seed = useLifeStore((s) => (id ? (s.receiptById.get(id) ?? null) : null));
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const applyTrace = useLifeStore((s) => s.applyTrace);

  const seq = useMemo(
    () => (seed ? buildMomentSequence(seed, receipts, edges) : []),
    [seed, receipts, edges],
  );
  const spanMin = useMemo(() => pathSpanMinutes(seq), [seq]);

  if (!seed) {
    return (
      <div className="px-8 py-20 text-center text-mute">
        Moment not found.{" "}
        <Link to="/network" className="text-accent">
          Back to network
        </Link>
      </div>
    );
  }

  const mood = timeOfDayMood(seed.timestamp);

  return (
    <div className="mx-auto max-w-2xl px-3 py-10 sm:px-4 sm:py-14 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">{formatWhen(seed.timestamp)}</p>
      <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
        {mood}
        <br />
        {seq.length} digital traces.
      </h1>
      <p className="mt-4 text-sm text-mute">
        These records appear connected because they share a date, a stored relationship, or both.
      </p>
      <div className="mt-12 space-y-0">
        {seq.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.12 + i * 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-card rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: TYPE_COLOR[r.type] }}>
                {TYPE_LABEL[r.type]}
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">{r.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-mute">{r.description}</p>
              {r.location && <p className="mt-2 text-xs uppercase tracking-[0.14em] text-mute">{r.location}</p>}
              {r.amount != null && <p className="mt-2 text-accent">₹{r.amount.toLocaleString("en-IN")}</p>}
            </div>
            {i < seq.length - 1 && <div className="mx-auto h-10 w-px bg-gradient-to-b from-accent/70 to-accent/10" />}
          </motion.div>
        ))}
      </div>
      {spanMin > 0 && (
        <p className="mt-12 text-center text-sm text-mute">
          These records occurred within {spanMin} minutes of each other.
        </p>
      )}
      {seed && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => {
              applyTrace([seed.id, ...neighborIds(seed.id), ...seq.map((r) => r.id)]);
              navigate("/network");
            }}
            className="min-h-11 rounded-full bg-accent px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            Follow on the network →
          </button>
        </div>
      )}
    </div>
  );
}
