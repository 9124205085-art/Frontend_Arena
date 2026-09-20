import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import { useLifeStore } from "./store";

const AppShell = lazy(() => import("./layouts/AppShell"));
const Overview = lazy(() => import("./pages/Overview"));
const Journey = lazy(() => import("./pages/Journey"));
const Network = lazy(() => import("./pages/Network"));
const Discoveries = lazy(() => import("./pages/Discoveries"));
const Moment = lazy(() => import("./pages/Moment"));
const SearchPage = lazy(() => import("./pages/Search"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center" role="status">
      <span className="mb-4 h-3 w-3 rounded-full bg-accent shadow-glow" />
      <p className="text-base text-white/80">Opening this view…</p>
    </div>
  );
}

function ArchiveLoading() {
  return (
    <div className="grain flex min-h-svh flex-col items-center justify-center bg-ink px-6 text-center" role="status" aria-live="polite">
      <div className="relative mb-8 h-16 w-16">
        <span className="animate-core absolute inset-0 rounded-full bg-accent/40 blur-xl" />
        <span className="absolute inset-4 rounded-full bg-accent shadow-glow" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Reading official archives</p>
      <p className="mt-4 text-2xl font-bold tracking-tight">Moments are connecting…</p>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-mute">
        Each record becomes a dot. Relationships become lines. Then you can click a moment and follow the story.
      </p>
    </div>
  );
}

function ArchiveGate() {
  const ready = useLifeStore((s) => s.ready);
  const error = useLifeStore((s) => s.error);
  const load = useLifeStore((s) => s.load);

  if (error) {
    return (
      <div className="grain flex min-h-svh items-center justify-center bg-ink px-6 text-center" role="alert">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Archive unavailable</p>
          <h1 className="mt-4 max-w-md text-2xl font-bold text-white">{error}</h1>
          <p className="mt-3 text-base text-mute">The official CSV archives could not be read in this browser.</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-8 min-h-12 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return <ArchiveLoading />;

  return (
    <Suspense fallback={<RouteFallback />}>
      <AppShell />
    </Suspense>
  );
}

export default function App() {
  const load = useLifeStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<ArchiveGate />}>
              <Route path="/overview" element={<Overview />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/network" element={<Network />} />
              <Route path="/discoveries" element={<Discoveries />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/moment/:id" element={<Moment />} />
              <Route path="/connections" element={<Navigate to="/network" replace />} />
              <Route path="/patterns" element={<Navigate to="/discoveries" replace />} />
              <Route path="/places" element={<Navigate to="/network" replace />} />
              <Route path="/chapters" element={<Navigate to="/discoveries" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
