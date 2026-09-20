import { lazy, Suspense, useMemo } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import MemoryFallback from "../components/MemoryFallback";
import { CountUp, MagneticLink } from "../components/ui";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { universePayload } from "../scene/universePayload";
import { useLifeStore } from "../store";

const MemoryUniverse = lazy(() => import("../scene/MemoryUniverse"));

export default function Landing() {
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const stats = useLifeStore((s) => s.overview);
  const show3d = !mobile && !reduced && receipts.length > 0;
  const payload = useMemo(
    () => (show3d ? universePayload(receipts, edges, false) : null),
    [show3d, receipts, edges],
  );

  return (
    <div className="grain vignette relative min-h-svh overflow-hidden bg-ink">
      {show3d && payload ? (
        <ErrorBoundary>
          <Suspense fallback={<MemoryFallback />}>
            <MemoryUniverse payload={payload} mobile={false} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <MemoryFallback />
      )}

      <div className="relative z-10 flex min-h-svh min-h-dvh flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <p className="landing-fade px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:tracking-[0.42em]">A digital memory museum</p>

        <h1 className="landing-fade landing-delay-1 mt-6 max-w-5xl break-words text-[clamp(2.15rem,11vw,7.6rem)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          YOUR LIFE,
          <br />
          IN RECEIPTS.
        </h1>

        <p className="landing-fade landing-delay-2 mt-7 max-w-lg text-base leading-relaxed text-mute sm:text-lg">
          Small moments. Hidden connections. One story.
        </p>

        <div className="landing-fade landing-delay-3 mt-10 flex flex-wrap justify-center gap-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute sm:mt-12 sm:gap-10 sm:text-[11px] sm:tracking-[0.22em]">
          <Stat n={stats?.total ?? 0} label="Moments" />
          <Stat n={stats?.categories ?? 0} label="Categories" />
          <Stat n={stats?.months ?? 0} label="Months" />
        </div>

        <div className="landing-fade landing-delay-4 mt-12 w-full max-w-sm sm:mt-14 sm:max-w-none">
          <MagneticLink to="/overview">Enter the memory network →</MagneticLink>
          <p className="mt-5 px-2 text-xs tracking-wide text-mute">Click a moment. Follow its connections. Discover the story.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
        <CountUp value={n} />
      </p>
      <p className="mt-1">{label}</p>
    </div>
  );
}
