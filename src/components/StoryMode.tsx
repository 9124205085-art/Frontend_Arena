import { useEffect } from "react";
import { formatDay, TYPE_COLOR, TYPE_LABEL } from "../lib/theme";
import { STORY_THEMES } from "../lib/storyThemes";
import { useFilteredReceipts, useLifeStore } from "../store";
import type { Chapter, Receipt } from "../data/types";

export default function StoryMode() {
  const chapters = useLifeStore((s) => s.chapters);
  const activeChapterId = useLifeStore((s) => s.activeChapterId);
  const enterStory = useLifeStore((s) => s.enterStory);
  const chapter = chapters.find((c) => c.id === activeChapterId) ?? chapters[0];

  useEffect(() => {
    if (!activeChapterId && chapters[0]) enterStory(chapters[0].id);
  }, [activeChapterId, chapters, enterStory]);

  if (!chapter) return null;

  const theme = STORY_THEMES[chapter.visual];

  return (
    <div
      className="relative z-20 min-h-svh pt-28"
      style={{
        background: theme.bg,
        color: theme.ink,
        fontFamily: theme.fontBody,
      }}
    >
      <StoryBackdrop visual={chapter.visual} />
      {chapter.visual === "frequency" && <FrequencySite chapter={chapter} />}
      {chapter.visual === "ledger" && <LedgerSite chapter={chapter} />}
      {chapter.visual === "wander" && <WanderSite chapter={chapter} />}
    </div>
  );
}

function useChapterReceipts(chapter: Chapter): Receipt[] {
  const receipts = useFilteredReceipts();
  return receipts.filter((r) => chapter.receiptIds.includes(r.id));
}

function FrequencySite({ chapter }: { chapter: Chapter }) {
  const select = useLifeStore((s) => s.select);
  const followTargetId = useLifeStore((s) => s.followTargetId);
  const clearFollow = useLifeStore((s) => s.clearFollow);
  const members = useChapterReceipts(chapter);
  const theme = STORY_THEMES.frequency;
  const nowPlaying = members.find((r) => r.type === "music") ?? members[0];

  useEffect(() => {
    if (!followTargetId) return;
    document.getElementById(`receipt-${followTargetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => clearFollow(), 700);
    return () => window.clearTimeout(t);
  }, [followTargetId, clearFollow]);

  return (
    <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-24 md:grid-cols-[0.9fr_1.1fr] md:px-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
          On air · {chapter.kicker}
        </p>
        <h1 className="mt-3 text-5xl leading-[0.95] md:text-6xl" style={{ fontFamily: theme.fontDisplay }}>
          {chapter.title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-80">{chapter.description}</p>
        {nowPlaying && (
          <button type="button" onClick={() => select(nowPlaying.id)} className="mt-8 w-full rounded-2xl border p-5 text-left" style={{ borderColor: theme.border, background: theme.card }}>
            <p className="text-[10px] uppercase tracking-[0.24em] opacity-50">Now playing</p>
            <p className="mt-2 text-2xl" style={{ fontFamily: theme.fontDisplay }}>
              {nowPlaying.title}
            </p>
            <p className="mt-1 text-xs opacity-60">{formatDay(nowPlaying.timestamp)}</p>
          </button>
        )}
        <div className="mt-6 flex h-16 items-end gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="eq-bar w-2 flex-1 rounded-sm"
              style={{ animationDelay: `${i * 0.08}s`, background: i % 3 === 0 ? theme.accent : theme.muted }}
            />
          ))}
        </div>
      </div>
      <ul className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
        {members.map((r) => (
          <ReceiptRow key={r.id} receipt={r} onOpen={() => select(r.id)} />
        ))}
      </ul>
    </div>
  );
}

function LedgerSite({ chapter }: { chapter: Chapter }) {
  const select = useLifeStore((s) => s.select);
  const followTargetId = useLifeStore((s) => s.followTargetId);
  const clearFollow = useLifeStore((s) => s.clearFollow);
  const members = useChapterReceipts(chapter);

  useEffect(() => {
    if (!followTargetId) return;
    document.getElementById(`receipt-${followTargetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => clearFollow(), 700);
    return () => window.clearTimeout(t);
  }, [followTargetId, clearFollow]);

  return (
    <div className="relative mx-auto max-w-4xl px-4 pb-24 md:px-8">
      <div className="ledger-page rounded-sm border border-[#1a2744]/20 bg-[#fffbf2] p-6 shadow-[8px_12px_40px_rgba(26,39,68,0.12)] md:p-10">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#9a3412]">Folio 02 · {chapter.kicker}</p>
        <h1 className="mt-2 font-[IBM_Plex_Serif] text-4xl text-[#1a2744] md:text-5xl">{chapter.title}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#5c4a32]">
          {formatDay(chapter.start)} — {formatDay(chapter.end)}
        </p>
        <p className="mt-4 max-w-2xl font-[IBM_Plex_Serif] text-lg italic leading-relaxed text-[#1a2744]/80">
          {chapter.description}
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1a2744]/30 text-[10px] uppercase tracking-[0.18em] text-[#9a3412]">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Particulars</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {members.map((r) => (
                <tr
                  key={r.id}
                  id={`receipt-${r.id}`}
                  className="cursor-pointer border-b border-[#1a2744]/10 hover:bg-[#9a3412]/5"
                  onClick={() => select(r.id)}
                >
                  <td className="py-2.5 pr-3 whitespace-nowrap opacity-70">{formatDay(r.timestamp)}</td>
                  <td className="py-2.5 pr-3 font-[IBM_Plex_Serif]">{r.title}</td>
                  <td className="py-2.5 pr-3 uppercase tracking-wider opacity-60">{TYPE_LABEL[r.type]}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {r.amount != null ? `₹${r.amount.toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WanderSite({ chapter }: { chapter: Chapter }) {
  const select = useLifeStore((s) => s.select);
  const followTargetId = useLifeStore((s) => s.followTargetId);
  const clearFollow = useLifeStore((s) => s.clearFollow);
  const members = useChapterReceipts(chapter);

  useEffect(() => {
    if (!followTargetId) return;
    document.getElementById(`receipt-${followTargetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => clearFollow(), 700);
    return () => window.clearTimeout(t);
  }, [followTargetId, clearFollow]);

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 md:px-8">
      <p className="text-[10px] uppercase tracking-[0.32em] text-[#e07a5f]">Passport of a later self · {chapter.kicker}</p>
      <h1 className="mt-3 font-[Fraunces] text-5xl italic leading-[0.95] md:text-6xl">{chapter.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-80">{chapter.description}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((r, i) => (
          <li key={r.id} id={`receipt-${r.id}`} style={{ transform: `rotate(${((i % 5) - 2) * 1.2}deg)` }}>
            <button
              type="button"
              onClick={() => select(r.id)}
              className="h-full w-full rounded-sm border bg-[#f6efe4] p-4 text-left text-[#14241f] shadow-lg"
              style={{ borderColor: "rgba(224,122,95,0.35)" }}
            >
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#f6efe4]" style={{ background: TYPE_COLOR[r.type] }}>
                {TYPE_LABEL[r.type]}
              </span>
              <span className="mt-3 block font-[Fraunces] text-xl leading-tight">{r.title}</span>
              <span className="mt-2 block text-xs opacity-60">
                {r.location || "Somewhere unnamed"} · {formatDay(r.timestamp)}
              </span>
              <span className="mt-3 line-clamp-3 block text-sm leading-relaxed opacity-80">{r.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReceiptRow({ receipt, onOpen }: { receipt: Receipt; onOpen: () => void }) {
  return (
    <li id={`receipt-${receipt.id}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:border-cyan-300/40"
      >
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[receipt.type] }} />
        <span>
          <span className="block text-sm">{receipt.title}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] opacity-50">
            {TYPE_LABEL[receipt.type]} · {formatDay(receipt.timestamp)}
          </span>
        </span>
      </button>
    </li>
  );
}

function StoryBackdrop({ visual }: { visual: Chapter["visual"] }) {
  if (visual === "frequency") {
    return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_55%)]" />;
  }
  if (visual === "ledger") {
    return <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(#c4b59a_0_1px,transparent_1px_28px)]" />;
  }
  return <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#81b29a_1px,transparent_1px)] [background-size:22px_22px]" />;
}
