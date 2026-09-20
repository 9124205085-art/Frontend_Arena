import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLifeStore } from "../store";
import { useDebounced } from "../hooks/useDebounced";

export default function Header() {
  const navigate = useNavigate();
  const query = useLifeStore((s) => s.query);
  const setQuery = useLifeStore((s) => s.setQuery);
  const [draft, setDraft] = useState(query);
  const debouncedDraft = useDebounced(draft, 180);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    if (debouncedDraft !== useLifeStore.getState().query) setQuery(debouncedDraft);
  }, [debouncedDraft, setQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement | null)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/[0.08] bg-[#07070A]/72 px-3 py-2.5 backdrop-blur-2xl sm:gap-4 sm:px-4 md:px-8" style={{ paddingTop: "max(0.65rem, env(safe-area-inset-top))" }}>
      <p className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-mute lg:block">Life // Receipts</p>
      <label className="relative min-w-0 flex-1 max-w-xl">
        <span className="sr-only">Search your life</span>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setQuery(draft);
              navigate("/search");
            }
          }}
          placeholder="Search your life…"
          enterKeyHint="search"
          className="min-h-11 w-full rounded-full border border-white/[0.08] bg-[#121218]/90 py-2.5 pl-9 pr-4 text-base outline-none placeholder:text-mute/80 transition focus:border-accent/50 focus:shadow-[0_0_0_4px_rgba(124,107,255,0.12)] md:text-sm"
        />
      </label>
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => navigate("/discoveries")}
          className="min-h-11 rounded-full px-3 text-sm font-semibold text-mute transition hover:text-white"
        >
          Discoveries
        </button>
        <button type="button" onClick={() => navigate("/")} aria-label="Return to landing" className="px-2 text-right">
          <p className="text-sm font-semibold">Alex</p>
          <p className="text-xs text-mute">Landing</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/network")}
          className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Open map
        </button>
      </div>
    </header>
  );
}
