import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Journey from "./pages/Journey";
import Network from "./pages/Network";
import Discoveries from "./pages/Discoveries";
import Moment from "./pages/Moment";
import SearchPage from "./pages/Search";
import { useLifeStore } from "./store";

export default function App() {
  const load = useLifeStore((s) => s.load);
  const ready = useLifeStore((s) => s.ready);
  const error = useLifeStore((s) => s.error);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="grain flex min-h-svh items-center justify-center bg-ink px-6 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Archive unavailable</p>
          <p className="mt-4 max-w-md text-xl text-mute">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="grain flex min-h-svh flex-col items-center justify-center bg-ink">
        <div className="relative mb-8 h-16 w-16">
          <span className="animate-core absolute inset-0 rounded-full bg-accent/40 blur-xl" />
          <span className="absolute inset-4 rounded-full bg-accent shadow-glow" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Reading official archives</p>
        <p className="mt-4 text-2xl font-bold tracking-tight">Household, Spotify, India…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppShell />}>
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
    </BrowserRouter>
  );
}
