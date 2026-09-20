import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { neighborIds, useLifeStore } from "../store";
import { buildMomentSequence, pathSpanMinutes, timeOfDayMood } from "../domain/story";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatWhen } from "../utils/format";
import { EmptyState } from "../components/ui";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function Moment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const seed = useLifeStore((s) => (id ? (s.receiptById.get(id) ?? null) : null));
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const applyTrace = useLifeStore((s) => s.applyTrace);
  const reduced = usePrefersReducedMotion();

  const seq = useMemo(
    () => (seed ? buildMomentSequence(seed, receipts, edges) : []),
    [seed, receipts, edges],
  );
  const spanMin = useMemo(() => pathSpanMinutes(seq), [seq]);

  if (!seed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Moment not found"
          body="That receipt is not in the loaded archive. Return to the map and pick a dot."
          action={
            <Link
              to="/network"
              className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Open the memory network →
            </Link>
          }
        />
      </div>
    );
  }

  const mood = timeOfDayMood(seed.timestamp);

  function showOnNetwork(ids: string[]) {
    applyTrace(ids);
    navigate("/network");
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-10 sm:px-4 sm:py-14 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{formatWhen(seed.timestamp)}</p>
      <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
        {mood}
        <br />
        {seq.length} digital traces.
      </h1>
      <p className="mt-4 text-base text-mute">
        These records appear connected because they share a date, a stored relationship, or both. Open any one on the
        map.
      </p>
      <div className="mt-12 space-y-0">
        {seq.map((r, i) => (
          <motion.div
            key={r.id}
            initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: reduced ? 0 : 0.12 + i * 0.2, duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => showOnNetwork([r.id, ...neighborIds(r.id)])}
              className="w-full rounded-2xl border border-white/[0.08] bg-[#121218]/80 p-5 text-left transition hover:border-accent/50 hover:bg-[#16161f]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: TYPE_COLOR[r.type] }}>
                {TYPE_LABEL[r.type]}
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">{r.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-mute">{r.description}</p>
              {r.location && <p className="mt-2 text-xs uppercase tracking-[0.14em] text-mute">{r.location}</p>}
              {r.amount != null && <p className="mt-2 text-accent">₹{r.amount.toLocaleString("en-IN")}</p>}
              <p className="mt-3 text-sm font-semibold text-accent">Show on network →</p>
            </button>
            {i < seq.length - 1 && <div className="mx-auto h-10 w-px bg-gradient-to-b from-accent/70 to-accent/10" />}
          </motion.div>
        ))}
      </div>
      {spanMin > 0 && (
        <p className="mt-12 text-center text-sm text-mute">
          These records occurred within {spanMin} minutes of each other.
        </p>
      )}
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => showOnNetwork([seed.id, ...neighborIds(seed.id), ...seq.map((r) => r.id)])}
          className="min-h-12 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Follow on the network →
        </button>
      </div>
    </div>
  );
}
