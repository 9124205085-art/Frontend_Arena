import { motion } from "framer-motion";
import { formatDay } from "../lib/theme";
import { STORY_THEMES } from "../lib/storyThemes";
import { useLifeStore } from "../store";

export default function LandingScene() {
  const chapters = useLifeStore((s) => s.chapters);
  const receipts = useLifeStore((s) => s.receipts);
  const enterStory = useLifeStore((s) => s.enterStory);
  const setMode = useLifeStore((s) => s.setMode);

  return (
    <div className="relative z-20 min-h-svh px-4 pb-16 pt-28 md:px-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-[#e8d5a3]">
          Three datasets · three websites · one life
        </p>
        <h1 className="mt-4 font-[Syne] text-5xl leading-[0.95] text-[#eef1f6] md:text-7xl">
          Your Life, In Receipts
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#9aa3b5]">
          {receipts.length} disconnected moments from a midnight playlist, a household ledger, and a
          wanderer’s card. Each story is its own site. Step into one.
        </p>
      </motion.header>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        {chapters.map((chapter, i) => {
          const theme = STORY_THEMES[chapter.visual];
          return (
            <motion.button
              key={chapter.id}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * i }}
              onClick={() => enterStory(chapter.id)}
              className="group min-h-[22rem] rounded-3xl border p-6 text-left transition hover:-translate-y-1"
              style={{
                background: theme.card,
                borderColor: theme.border,
                color: theme.ink,
                fontFamily: theme.fontBody,
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.28em] opacity-70">
                Site {String(i + 1).padStart(2, "0")} · {chapter.receiptIds.length} receipts
              </p>
              <h2 className="mt-4 text-3xl leading-tight" style={{ fontFamily: theme.fontDisplay }}>
                {chapter.title}
              </h2>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] opacity-60">{chapter.kicker}</p>
              <p className="mt-4 text-sm leading-relaxed opacity-80">{chapter.description}</p>
              <p className="mt-6 text-[11px] uppercase tracking-[0.18em] opacity-50">
                {formatDay(chapter.start)} — {formatDay(chapter.end)}
              </p>
              <span
                className="mt-8 inline-block text-xs uppercase tracking-[0.22em]"
                style={{ color: theme.accent }}
              >
                Enter this site →
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className="text-xs uppercase tracking-[0.22em] text-[#9aa3b5] underline-offset-4 hover:text-[#e8d5a3] hover:underline"
        >
          Or follow the threads between them
        </button>
      </div>
    </div>
  );
}
