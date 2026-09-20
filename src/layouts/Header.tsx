import { Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useLifeStore } from "../store";

export default function Header() {
  const navigate = useNavigate();
  const query = useLifeStore((s) => s.query);
  const setQuery = useLifeStore((s) => s.setQuery);
  const ref = useRef<HTMLInputElement>(null);

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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#07070A]/72 px-4 py-3 backdrop-blur-2xl md:px-8">
      <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-mute sm:block">Life // Receipts</p>
      <label className="relative min-w-0 flex-1 max-w-xl">
        <span className="sr-only">Search your life</span>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/search");
          }}
          placeholder="Search your life…  /"
          className="w-full rounded-full border border-white/[0.08] bg-[#121218]/90 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-mute/80 transition focus:border-accent/50 focus:shadow-[0_0_0_4px_rgba(124,107,255,0.12)]"
        />
      </label>
      <div className="hidden items-center gap-3 sm:flex">
        <button
          type="button"
          aria-label="Open discoveries"
          onClick={() => navigate("/discoveries")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-mute transition hover:text-white"
        >
          <Bell size={15} />
        </button>
        <button type="button" onClick={() => navigate("/")} className="text-right">
          <p className="text-sm font-semibold">Alex</p>
          <p className="text-[10px] uppercase tracking-wider text-mute">Explorer</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/network")}
          aria-label="Open memory network"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/30 text-xs font-bold ring-1 ring-white/10"
        >
          A
        </button>
      </div>
    </header>
  );
}
