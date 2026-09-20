import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useLifeStore } from "../store";
import { getClusters, getRelatedReceipts } from "../utils/analyzeData";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatWhen } from "../utils/format";

export default function Moment() {
  const { id } = useParams();
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const seed = receipts.find((r) => r.id === id);
  const clusters = getClusters(receipts, 2);
  const cluster =
    clusters.find((c) => c.receipts.some((r) => r.id === id)) ??
    (seed
      ? { id: seed.id, date: seed.timestamp.slice(0, 10), receipts: [seed, ...getRelatedReceipts(seed.id, receipts, edges)].slice(0, 6), types: [] }
      : null);

  const seq = useMemo(() => cluster?.receipts.slice(0, 6) ?? [], [cluster]);
  const spanMin = useMemo(() => {
    if (seq.length < 2) return 0;
    const t = seq.map((r) => new Date(r.timestamp).getTime()).sort((a, b) => a - b);
    return Math.round((t[t.length - 1] - t[0]) / 60000);
  }, [seq]);

  if (!seed || !cluster) {
    return (
      <div className="px-8 py-20 text-mute">
        Moment not found. <Link to="/journey" className="text-accent">Back to journey</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">{formatWhen(seed.timestamp)}</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight">
        One ordinary night.
        <br />
        {seq.length} digital traces.
      </h1>
      <div className="mt-10 space-y-0">
        {seq.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.18 }}
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#121218] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: TYPE_COLOR[r.type] }}>
                {TYPE_LABEL[r.type]}
              </p>
              <h2 className="mt-2 text-xl font-bold">{r.title}</h2>
              <p className="mt-1 text-sm text-mute">{r.description}</p>
              {r.amount != null && <p className="mt-2 text-accent">₹{r.amount.toLocaleString("en-IN")}</p>}
            </div>
            {i < seq.length - 1 && <div className="mx-auto h-8 w-px bg-accent/40" />}
          </motion.div>
        ))}
      </div>
      {spanMin > 0 && (
        <p className="mt-10 text-center text-sm text-mute">
          These moments happened within {spanMin} minutes of each other.
        </p>
      )}
    </div>
  );
}
