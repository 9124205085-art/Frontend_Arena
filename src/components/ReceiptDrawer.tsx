import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLifeStore } from "../store";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatWhen } from "../utils/format";
import { getRelatedReceipts } from "../utils/analyzeData";
import { edgesFor, otherId } from "../data/connectionEngine";

export default function ReceiptDrawer() {
  const selectedId = useLifeStore((s) => s.selectedId);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const select = useLifeStore((s) => s.select);
  const selected = receipts.find((r) => r.id === selectedId);
  const related = selected ? getRelatedReceipts(selected.id, receipts, edges) : [];
  const links = selected ? edgesFor(selected.id, edges) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          className="glass fixed bottom-20 right-3 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl p-5 md:bottom-6 md:right-6"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink"
              style={{ background: TYPE_COLOR[selected.type] }}
            >
              {TYPE_LABEL[selected.type]}
            </span>
            <button type="button" onClick={() => select(null)} className="text-mute hover:text-white" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <h2 className="mt-3 text-xl font-bold leading-tight">{selected.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
            {formatWhen(selected.timestamp)}
            {selected.location ? ` · ${selected.location}` : ""}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-mute">{selected.description}</p>
          {selected.amount != null && (
            <p className="mt-2 text-accent">₹{selected.amount.toLocaleString("en-IN")}</p>
          )}
          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-mute">
            Connected moments: {related.length}
          </p>
          <ul className="mt-2 space-y-2">
            {links.slice(0, 4).map((edge) => {
              const other = receipts.find((r) => r.id === otherId(edge, selected.id));
              if (!other) return null;
              return (
                <li key={`${edge.a}-${edge.b}`}>
                  <button type="button" onClick={() => select(other.id)} className="w-full rounded-xl border border-white/[0.08] px-3 py-2 text-left text-sm hover:border-accent/40">
                    {other.title}
                    <span className="mt-0.5 block text-[11px] text-mute">{edge.detail}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            to={`/moment/${selected.id}`}
            className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-accent"
          >
            View connection →
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
