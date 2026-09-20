import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TYPE_COLOR, TYPE_LABEL, formatDay } from "../lib/theme";
import { useFilteredReceipts, useLifeStore } from "../store";
import type { Chapter, Receipt } from "../data/types";

gsap.registerPlugin(ScrollTrigger);

export default function ChapterSection({
  chapter,
  index,
}: {
  chapter: Chapter;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const receipts = useFilteredReceipts();
  const setActiveChapter = useLifeStore((s) => s.setActiveChapter);
  const select = useLifeStore((s) => s.select);
  const followTargetId = useLifeStore((s) => s.followTargetId);
  const clearFollow = useLifeStore((s) => s.clearFollow);
  const members = receipts.filter((r) => chapter.receiptIds.includes(r.id));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const copy = node.querySelector("[data-chapter-copy]");
    const tween = copy
      ? gsap.from(copy, {
          y: 28,
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: node, start: "top 78%" },
        })
      : null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActiveChapter(chapter.id);
      },
      { threshold: 0.45 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [chapter.id, setActiveChapter]);

  useEffect(() => {
    if (!followTargetId) return;
    if (!chapter.receiptIds.includes(followTargetId)) return;
    document.getElementById(`receipt-${followTargetId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const t = window.setTimeout(() => clearFollow(), 800);
    return () => window.clearTimeout(t);
  }, [followTargetId, chapter.receiptIds, clearFollow]);

  return (
    <section
      ref={ref}
      id={chapter.id}
      className="flex min-h-[100svh] items-center px-4 py-24 md:max-w-xl md:px-8"
    >
      <div data-chapter-copy className="pointer-events-auto w-full rounded-3xl border border-amber-100/10 bg-dusk-950/55 p-6 backdrop-blur-md md:p-8">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-amber-glow/80">
          Chapter {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="font-display mt-2 text-4xl leading-tight text-amber-50 md:text-5xl">{chapter.title}</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-100/40">
          {formatDay(chapter.start)} — {formatDay(chapter.end)}
        </p>
        <p className="mt-4 font-display text-lg italic leading-relaxed text-amber-100/80">{chapter.description}</p>
        <ul className="mt-6 max-h-[46vh] space-y-2 overflow-y-auto pr-1">
          {members.length === 0 && (
            <li className="text-sm text-amber-100/40">No leaves in this grove match the current filters.</li>
          )}
          {members.map((r) => (
            <ChapterLeaf key={r.id} receipt={r} onOpen={() => select(r.id)} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ChapterLeaf({ receipt, onOpen }: { receipt: Receipt; onOpen: () => void }) {
  return (
    <li id={`receipt-${receipt.id}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl border border-amber-100/5 bg-amber-50/5 px-3 py-2 text-left hover:border-amber-glow/30 hover:bg-amber-50/10"
      >
        <span
          className="mt-1 inline-block h-3 w-3 rotate-45 rounded-[1px]"
          style={{ background: TYPE_COLOR[receipt.type] }}
        />
        <span>
          <span className="block font-sans text-sm text-amber-50">{receipt.title}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-amber-100/40">
            {TYPE_LABEL[receipt.type]} · {formatDay(receipt.timestamp)}
          </span>
        </span>
      </button>
    </li>
  );
}
