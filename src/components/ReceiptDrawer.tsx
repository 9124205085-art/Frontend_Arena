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

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  return (
    <AnimatePresence>
      {selected && (
        <>
          <motion.button
            type="button"
            aria-label="Close receipt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => select(null)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            initial={{ x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed bottom-20 right-3 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl p-5 md:bottom-6 md:right-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink"
                style={{ background: TYPE_COLOR[selected.type] }}
              >
                {TYPE_LABEL[selected.type]}
              </span>
              <button type="button" onClick={() => select(null)} className="text-mute transition hover:text-white" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <h2 id="receipt-title" className="mt-3 text-xl font-bold leading-tight tracking-tight">
              {selected.title}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
              {formatWhen(selected.timestamp)}
              {selected.location ? ` · ${selected.location}` : ""}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mute">{selected.description}</p>
            {selected.amount != null && (
              <p className="mt-2 text-accent">₹{selected.amount.toLocaleString("en-IN")}</p>
            )}
            {selected.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.tags.slice(0, 5).map((t) => (
                  <span key={t} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-wider text-mute">
                    {t}
                  </span>
                ))}
              </div>
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
                    <button
                      type="button"
                      onClick={() => select(other.id)}
                      className="w-full rounded-xl border border-white/[0.08] px-3 py-2 text-left text-sm transition hover:border-accent/40 hover:bg-white/[0.03]"
                    >
                      {other.title}
                      <span className="mt-0.5 block text-[11px] text-mute">{edge.detail}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              to={`/moment/${selected.id}`}
              onClick={() => select(null)}
              className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-accent"
            >
              View connection →
            </Link>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
