import { motion } from "framer-motion";
import ErrorBoundary from "../components/ErrorBoundary";
import MemoryFallback from "../components/MemoryFallback";
import { CountUp, MagneticLink } from "../components/ui";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import MemoryUniverse from "../scene/MemoryUniverse";
import { useLifeStore } from "../store";
import { getOverview } from "../utils/analyzeData";

export default function Landing() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const stats = getOverview(receipts);
  const show3d = !mobile && !reduced;

  return (
    <div className="grain vignette relative min-h-svh overflow-hidden bg-ink">
      {show3d ? (
        <ErrorBoundary>
          <MemoryUniverse receipts={receipts} edges={edges} mobile={false} />
        </ErrorBoundary>
      ) : (
        <MemoryFallback />
      )}

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.42em" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[10px] font-semibold uppercase text-accent"
        >
          A digital memory museum
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.18, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-5xl text-[clamp(3rem,11vw,7.6rem)] font-extrabold leading-[0.86] tracking-[-0.055em]"
        >
          YOUR LIFE,
          <br />
          IN RECEIPTS.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-7 max-w-lg text-lg leading-relaxed text-mute"
        >
          {stats.total.toLocaleString("en-IN")} records from the provided archives.
          <br />
          One story waiting to be discovered.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7 }}
          className="mt-12 flex flex-wrap justify-center gap-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-mute"
        >
          <Stat n={stats.total} label="Moments" />
          <Stat n={stats.categories} label="Categories" />
          <Stat n={stats.months} label="Months" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-14"
        >
          <MagneticLink to="/overview">Enter your story →</MagneticLink>
          <p className="mt-5 text-xs tracking-wide text-mute">Explore the moments that made up a life.</p>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
        <CountUp value={n} />
      </p>
      <p className="mt-1">{label}</p>
    </div>
  );
}
