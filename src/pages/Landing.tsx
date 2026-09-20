import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MemoryUniverse from "../scene/MemoryUniverse";
import ErrorBoundary from "../components/ErrorBoundary";
import { useLifeStore } from "../store";
import { getOverview } from "../utils/analyzeData";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Landing() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const mobile = useIsMobile();
  const stats = getOverview(receipts);

  return (
    <div className="grain relative min-h-svh overflow-hidden bg-ink">
      {!mobile && (
        <ErrorBoundary>
          <MemoryUniverse receipts={receipts} edges={edges} />
        </ErrorBoundary>
      )}
      {mobile && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,107,255,0.18),_transparent_60%)]" />}

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-accent"
        >
          A digital memory museum
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.92] tracking-tight md:text-8xl"
        >
          YOUR LIFE,
          <br />
          IN RECEIPTS.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-md text-lg text-mute"
        >
          Hundreds of moments.
          <br />
          One story waiting to be discovered.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-mute"
        >
          <Stat n={stats.total} label="Moments" />
          <Stat n={stats.categories} label="Categories" />
          <Stat n={stats.activeDays} label="Active days" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} className="mt-12">
          <Link
            to="/overview"
            className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-glow transition hover:brightness-110"
          >
            Enter your story →
          </Link>
          <p className="mt-4 text-xs text-mute">Explore the moments that made up a life.</p>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white">{n}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}
