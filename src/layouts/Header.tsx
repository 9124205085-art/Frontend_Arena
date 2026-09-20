import { Search } from "lucide-react";
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
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#07070A]/80 px-4 py-3 backdrop-blur-xl md:px-8">
      <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-mute sm:block">Your digital life</p>
      <label className="relative min-w-0 flex-1 max-w-xl">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/search");
          }}
          placeholder="Search your life…  /"
          className="w-full rounded-full border border-white/[0.08] bg-[#121218] py-2 pl-9 pr-4 text-sm outline-none placeholder:text-mute focus:border-accent/50"
        />
      </label>
      <div className="hidden items-center gap-3 sm:flex">
        <div className="text-right">
          <p className="text-sm font-semibold">Alex</p>
          <p className="text-[10px] uppercase tracking-wider text-mute">Explorer</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/30 text-xs font-bold">A</div>
      </div>
    </header>
  );
}
