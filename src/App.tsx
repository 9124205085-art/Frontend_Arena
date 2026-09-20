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
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-mute" role="status">
      Loading this view…
    </div>
  );
}

function ArchiveLoading() {
  return (
    <div className="grain flex min-h-svh flex-col items-center justify-center bg-ink" role="status" aria-live="polite">
      <div className="relative mb-8 h-16 w-16">
        <span className="animate-core absolute inset-0 rounded-full bg-accent/40 blur-xl" />
        <span className="absolute inset-4 rounded-full bg-accent shadow-glow" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Reading official archives</p>
      <p className="mt-4 text-2xl font-bold tracking-tight">Household, Spotify, India…</p>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Archive unavailable</p>
          <h1 className="mt-4 max-w-md text-xl font-bold text-mute">{error}</h1>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-6 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
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
