import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLifeStore } from "../store";
import { getCategoryStats, getChapters } from "../utils/analyzeData";
import { TYPE_COLOR } from "../utils/constants";
import { formatDay } from "../utils/format";
import { EmptyState, PageIntro } from "../components/ui";

export default function Chapters() {
  const receipts = useLifeStore((s) => s.receipts);
  const chapters = getChapters(receipts);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <PageIntro kicker="Chapters" title="Not months. Eras.">
        Automatically named from what dominated each stretch of the archive.
      </PageIntro>
      {chapters.length === 0 ? (
        <EmptyState title="No chapters yet" body="The archive needs more traces before eras can form." />
      ) : (
        <ol className="mt-12 space-y-8">
          {chapters.map((ch, i) => {
            const members = receipts.filter((r) => ch.receiptIds.includes(r.id));
            const cats = getCategoryStats(members);
            return (
              <motion.li
                key={ch.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card glow-border rounded-3xl p-6 md:p-8"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-mute">
                  {String(i + 1).padStart(2, "0")} · {ch.kicker}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{ch.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
                  {formatDay(ch.start)} — {formatDay(ch.end)}
                </p>
                <p className="mt-4 text-lg leading-relaxed text-mute">{ch.description}</p>
                <p className="mt-4 text-sm text-white">
                  {ch.momentCount} moments · dominant: {ch.dominantLabel}
                </p>
                <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-white/5">
                  {cats.map((c) => (
                    <div
                      key={c.type}
                      title={c.label}
                      style={{ width: `${(c.count / members.length) * 100}%`, background: TYPE_COLOR[c.type] }}
                    />
                  ))}
                </div>
                <Link
                  to={`/journey?day=${ch.start.slice(0, 10)}`}
                  className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-accent"
                >
                  Open this chapter’s moments →
                </Link>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
