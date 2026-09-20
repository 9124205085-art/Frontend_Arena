import { edgesFor, otherId } from "../data/connectionEngine";
import { TYPE_COLOR, TYPE_LABEL } from "../lib/theme";
import { useFilteredReceipts, useLifeStore } from "../store";
import { useIsMobile } from "../hooks/useIsMobile";
import MobileCardStack from "./MobileCardStack";

export default function ExploreMode() {
  const mobile = useIsMobile();
  const receipts = useFilteredReceipts();
  const all = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const chapters = useLifeStore((s) => s.chapters);
  const select = useLifeStore((s) => s.select);
  const followThread = useLifeStore((s) => s.followThread);
  const selectedId = useLifeStore((s) => s.selectedId);

  if (mobile) return <MobileCardStack />;

  const visible = new Set(receipts.map((r) => r.id));
  const threads = edges.filter((e) => visible.has(e.a) && visible.has(e.b)).slice(0, 48);

  return (
    <div className="relative z-20 min-h-svh px-4 pb-24 pt-36 md:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#e8d5a3]">The switchboard</p>
        <h1 className="mt-2 font-[Syne] text-4xl text-[#eef1f6] md:text-5xl">Threads between the three sites</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9aa3b5]">
          Same day, same place, shared words, a note that names a song. Open a receipt, or jump into
          another story’s website.
        </p>
        <ul className="mt-10 space-y-3">
          {threads.map((edge) => {
            const a = all.find((r) => r.id === edge.a);
            const b = all.find((r) => r.id === edge.b);
            if (!a || !b) return null;
            const sa = chapters.find((c) => c.receiptIds.includes(a.id));
            const sb = chapters.find((c) => c.receiptIds.includes(b.id));
            const hot = selectedId === a.id || selectedId === b.id;
            return (
              <li
                key={`${edge.a}-${edge.b}-${edge.reason}`}
                className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${hot ? "border-[#e8d5a3]/50" : ""}`}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9aa3b5]">{edge.detail}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ThreadChip receipt={a} story={sa?.title} color={TYPE_COLOR[a.type]} onClick={() => select(a.id)} />
                  <span className="text-xs opacity-40">→</span>
                  <ThreadChip receipt={b} story={sb?.title} color={TYPE_COLOR[b.type]} onClick={() => select(b.id)} />
                  {sa && sb && sa.id !== sb.id && (
                    <button
                      type="button"
                      onClick={() => followThread(a.id, b.id)}
                      className="ml-auto text-[10px] uppercase tracking-[0.16em] text-[#e8d5a3]"
                    >
                      Jump to {sb.title}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ThreadChip({
  receipt,
  story,
  color,
  onClick,
}: {
  receipt: { id: string; title: string; type: keyof typeof TYPE_LABEL };
  story?: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-white/10 px-3 py-1 text-left text-sm text-[#eef1f6]">
      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {receipt.title}
      {story ? <span className="ml-2 text-[10px] uppercase tracking-wider opacity-40">{story}</span> : null}
    </button>
  );
}
