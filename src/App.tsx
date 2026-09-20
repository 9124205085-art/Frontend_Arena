import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Journey from "./pages/Journey";
import Connections from "./pages/Connections";
import Moment from "./pages/Moment";
import Chapters from "./pages/Chapters";
import Patterns from "./pages/Patterns";
import Places from "./pages/Places";
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
      <div className="flex min-h-svh items-center justify-center bg-ink px-6 text-center">
        <p className="text-xl text-mute">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-ink">
        <p className="text-[10px] uppercase tracking-[0.32em] text-accent">Opening the archive</p>
        <p className="mt-4 text-2xl font-bold">Gathering a life…</p>
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
          <Route path="/connections" element={<Connections />} />
          <Route path="/moment/:id" element={<Moment />} />
          <Route path="/chapters" element={<Chapters />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/places" element={<Places />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
