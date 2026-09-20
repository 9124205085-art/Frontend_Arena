import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { edgesFor, otherId } from "../data/connectionEngine";
import { TYPE_COLOR, TYPE_LABEL, formatWhen } from "../lib/theme";
import { STORY_THEMES } from "../lib/storyThemes";
import { useLifeStore, useSelected } from "../store";

export default function ReceiptCard() {
  const selected = useSelected();
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const chapters = useLifeStore((s) => s.chapters);
  const select = useLifeStore((s) => s.select);
  const followThread = useLifeStore((s) => s.followThread);
  const activeChapterId = useLifeStore((s) => s.activeChapterId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  const links = selected ? edgesFor(selected.id, edges) : [];
  const chapter =
    chapters.find((c) => c.id === activeChapterId) ??
    chapters.find((c) => selected && c.receiptIds.includes(selected.id));
  const theme = chapter ? STORY_THEMES[chapter.visual] : null;

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key={selected.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="pointer-events-auto fixed bottom-4 right-4 z-50 w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border p-5 shadow-xl backdrop-blur-xl md:top-36 md:bottom-auto"
          style={{
            background: theme?.card ?? "rgba(12,14,18,0.92)",
            borderColor: theme?.border ?? "rgba(255,255,255,0.12)",
            color: theme?.ink ?? "#eef1f6",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-900"
              style={{ background: TYPE_COLOR[selected.type] }}
            >
              {TYPE_LABEL[selected.type]}
            </span>
            <button type="button" onClick={() => select(null)} aria-label="Close receipt" className="opacity-50 hover:opacity-100">
              ✕
            </button>
          </div>
          <h2 className="mt-3 text-2xl leading-tight" style={{ fontFamily: theme?.fontDisplay }}>
            {selected.title}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-50">
            {formatWhen(selected.timestamp)}
            {selected.location ? ` · ${selected.location}` : ""}
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-80">{selected.description}</p>
          {selected.amount != null && (
            <p className="mt-2 text-lg" style={{ color: theme?.accent }}>
              ₹{selected.amount.toLocaleString("en-IN")}
            </p>
          )}
          {links.length > 0 && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: theme?.border }}>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">This also connects to…</p>
              <ul className="mt-2 space-y-2">
                {links.slice(0, 4).map((edge) => {
                  const oid = otherId(edge, selected.id);
                  const other = receipts.find((r) => r.id === oid);
                  if (!other) return null;
                  const otherStory = chapters.find((c) => c.receiptIds.includes(other.id));
                  return (
                    <li key={`${edge.a}-${edge.b}-${edge.reason}`} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm">{other.title}</p>
                        <p className="text-[11px] opacity-50">
                          {edge.detail}
                          {otherStory ? ` · ${otherStory.title}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => followThread(selected.id, other.id)}
                        className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                        style={{ borderColor: theme?.accent, color: theme?.accent }}
                      >
                        Follow this thread
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
