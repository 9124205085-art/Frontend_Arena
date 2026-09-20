import { lazy, Suspense, useMemo } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import MemoryFallback from "../components/MemoryFallback";
import { MagneticLink } from "../components/ui";
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
        <p className="landing-fade px-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:tracking-[0.36em]">
          A digital memory museum
        </p>

        <h1 className="landing-fade landing-delay-1 mt-6 max-w-5xl break-words text-[clamp(2.15rem,11vw,7.6rem)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          YOUR LIFE,
          <br />
          IN RECEIPTS.
        </h1>

        <ul className="landing-fade landing-delay-2 mt-8 max-w-md space-y-2 text-base leading-relaxed text-white/90 sm:text-lg">
          <li>Each dot is a moment.</li>
          <li>Lines show relationships.</li>
          <li>Click a moment. Follow the story.</li>
        </ul>

        <div className="landing-fade landing-delay-4 mt-12 w-full max-w-sm sm:mt-14 sm:max-w-none">
          <MagneticLink to="/overview">Enter the memory network →</MagneticLink>
        </div>
      </div>
    </div>
  );
}
