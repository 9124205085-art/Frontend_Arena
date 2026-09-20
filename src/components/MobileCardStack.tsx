import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TYPE_COLOR, TYPE_LABEL, formatWhen } from "../lib/theme";
import { useFilteredReceipts, useLifeStore } from "../store";
import { edgesFor, otherId } from "../data/connectionEngine";

export default function MobileCardStack() {
  const receipts = useFilteredReceipts();
  const all = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const followThread = useLifeStore((s) => s.followThread);
  const [index, setIndex] = useState(0);
  const card = receipts[index % Math.max(1, receipts.length)];
  const links = useMemo(() => (card ? edgesFor(card.id, edges) : []), [card, edges]);

  if (!receipts.length) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
        <p className="text-[#9aa3b5]">No receipts match those filters.</p>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 top-36 z-20 flex flex-col px-4 pb-6">
      <p className="mb-3 text-center font-sans text-[10px] uppercase tracking-[0.24em] text-[#9aa3b5]">
        Swipe the stack · {index + 1} / {receipts.length}
      </p>
      <div className="relative mx-auto h-[min(28rem,58svh)] w-full max-w-md">
        <AnimatePresence mode="wait">
          {card && (
            <motion.article
              key={card.id}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) setIndex((i) => (i + 1) % receipts.length);
                if (info.offset.x > 80) setIndex((i) => (i - 1 + receipts.length) % receipts.length);
              }}
              className="absolute inset-0 overflow-y-auto rounded-3xl border border-white/10 bg-[#12141a]/95 p-5"
            >
              <span
                className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-900"
                style={{ background: TYPE_COLOR[card.type] }}
              >
                {TYPE_LABEL[card.type]}
              </span>
              <h2 className="mt-3 font-[Syne] text-3xl text-[#eef1f6]">{card.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#9aa3b5]">{formatWhen(card.timestamp)}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#eef1f6]/75">{card.description}</p>
              {links.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9aa3b5]">Threads</p>
                  {links.slice(0, 3).map((edge) => {
                    const other = all.find((r) => r.id === otherId(edge, card.id));
                    if (!other) return null;
                    return (
                      <button
                        key={other.id}
                        type="button"
                        onClick={() => {
                          followThread(card.id, other.id);
                          const next = receipts.findIndex((r) => r.id === other.id);
                          if (next >= 0) setIndex(next);
                        }}
                        className="block w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-[#eef1f6]"
                      >
                        {other.title}
                        <span className="mt-0.5 block text-[11px] text-[#9aa3b5]">{edge.detail}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex justify-center gap-6">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + receipts.length) % receipts.length)}
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#eef1f6]/70"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % receipts.length)}
          className="rounded-full bg-[#e8d5a3] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[#111827]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
