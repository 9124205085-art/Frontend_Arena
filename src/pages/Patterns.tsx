import { motion } from "framer-motion";
import { useLifeStore } from "../store";
import { getHourlyActivity, getPatterns } from "../utils/analyzeData";
import { formatHour } from "../utils/format";
import { EmptyState, PageIntro } from "../components/ui";

export default function Patterns() {
  const receipts = useLifeStore((s) => s.receipts);
  const patterns = getPatterns(receipts);
  const hours = getHourlyActivity(receipts);
  const max = Math.max(1, ...hours.map((h) => h.count));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <PageIntro kicker="Discovery" title="Patterns we found">
        Each card is counted from the official records. If the data does not support a claim, it is not shown.
      </PageIntro>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#0D0D12] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mute">Activity by hour</p>
        <div className="mt-4 flex h-36 min-w-[640px] items-end gap-1">
          {hours.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-sm bg-gradient-to-t from-accent/30 to-accent"
                style={{
                  height: `${Math.max(4, (h.count / max) * 100)}%`,
                  boxShadow: h.count / max > 0.65 ? "0 0 16px rgba(124,107,255,0.45)" : undefined,
                }}
                title={`${formatHour(h.hour)} · ${h.count}`}
              />
              {h.hour % 3 === 0 && <span className="text-[9px] text-mute">{h.hour}</span>}
            </div>
          ))}
        </div>
      </div>

      {patterns.length === 0 ? (
        <EmptyState title="No patterns yet" body="Load more traces and the habits will surface." />
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {patterns.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card glow-border rounded-3xl p-6"
            >
              <p className="text-2xl" aria-hidden="true">
                {p.icon}
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight">{p.title}</h2>
              <p className="mt-2 leading-relaxed text-mute">{p.body}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">{p.detail}</p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
