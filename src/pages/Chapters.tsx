import { Link } from "react-router-dom";
import { useLifeStore } from "../store";
import { getCategoryStats, getChapters } from "../utils/analyzeData";
import { TYPE_COLOR } from "../utils/constants";
import { formatDay } from "../utils/format";

export default function Chapters() {
  const receipts = useLifeStore((s) => s.receipts);
  const chapters = getChapters(receipts);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Chapters</p>
      <h1 className="mt-2 text-4xl font-extrabold">Not months. Eras.</h1>
      <p className="mt-2 text-mute">Automatically named from what dominated each stretch of the archive.</p>
      <ol className="mt-12 space-y-10">
        {chapters.map((ch, i) => {
          const members = receipts.filter((r) => ch.receiptIds.includes(r.id));
          const cats = getCategoryStats(members);
          return (
            <li key={ch.id} className="rounded-3xl border border-white/[0.08] bg-[#121218] p-6 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-mute">
                {String(i + 1).padStart(2, "0")} · {ch.kicker}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold">{ch.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
                {formatDay(ch.start)} — {formatDay(ch.end)}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-mute">{ch.description}</p>
              <p className="mt-4 text-sm text-white">
                {ch.momentCount} moments · dominant: {ch.dominantLabel}
              </p>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/5">
                {cats.map((c) => (
                  <div
                    key={c.type}
                    style={{ width: `${(c.count / members.length) * 100}%`, background: TYPE_COLOR[c.type] }}
                  />
                ))}
              </div>
              <Link to="/journey" className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Open this chapter’s moments →
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
