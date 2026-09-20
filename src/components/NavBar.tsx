import { useLifeStore } from "../store";

export default function NavBar() {
  const mode = useLifeStore((s) => s.mode);
  const setMode = useLifeStore((s) => s.setMode);
  const chapters = useLifeStore((s) => s.chapters);
  const activeChapterId = useLifeStore((s) => s.activeChapterId);
  const enterStory = useLifeStore((s) => s.enterStory);
  const receipts = useLifeStore((s) => s.receipts);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-4 text-[#eef1f6] md:p-6">
      <button type="button" onClick={() => setMode("landing")} className="pointer-events-auto text-left">
        <p className="font-[Syne] text-lg leading-none text-inherit md:text-xl">Your Life, In Receipts</p>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.28em] opacity-50">
          {receipts.length} moments · 3 sites
        </p>
      </button>

      <nav className="pointer-events-auto flex max-w-[70vw] items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/35 px-1 py-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMode("landing")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
            mode === "landing" ? "bg-white/15" : "opacity-60 hover:opacity-100"
          }`}
        >
          Hub
        </button>
        {chapters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => enterStory(c.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
              mode === "story" && activeChapterId === c.id ? "bg-white/15" : "opacity-60 hover:opacity-100"
            }`}
          >
            {c.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
            mode === "explore" ? "bg-white/15" : "opacity-60 hover:opacity-100"
          }`}
        >
          Threads
        </button>
      </nav>
    </header>
  );
}
