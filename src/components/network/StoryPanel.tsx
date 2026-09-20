import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useLifeStore } from "../../store";
import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import { formatWhen } from "../../utils/format";
import { edgesFor, otherId } from "../../data/connectionEngine";
import { buildStoryPath } from "../../utils/networkGraph";
import { buildMomentNarration, buildPlaceNarration, startNarration, stopNarration } from "../../utils/narration";
import type { Receipt, ReceiptType } from "../../data/types";

export default function StoryPanel() {
  const navigate = useNavigate();
  const selectedId = useLifeStore((s) => s.selectedId);
  const selectedEdge = useLifeStore((s) => s.selectedEdge);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const select = useLifeStore((s) => s.select);
  const selectEdge = useLifeStore((s) => s.selectEdge);
  const selectPlace = useLifeStore((s) => s.selectPlace);
  const explorePlace = useLifeStore((s) => s.explorePlace);
  const storyPlaying = useLifeStore((s) => s.storyPlaying);
  const setStoryPlaying = useLifeStore((s) => s.setStoryPlaying);
  const setToast = useLifeStore((s) => s.setToast);
  const selected = receipts.find((r) => r.id === selectedId);
  const links = selected ? edgesFor(selected.id, edges) : [];
  const cancel = useRef(false);

  const path = useMemo(
    () => (selected ? buildStoryPath(selected, receipts, edges, 5) : []),
    [selected, receipts, edges],
  );

  const placeMix = useMemo(() => {
    if (!selectedPlace) return null;
    let count = 0;
    const byType: Partial<Record<ReceiptType, number>> = {};
    for (const r of receipts) {
      if (r.location !== selectedPlace) continue;
      count += 1;
      byType[r.type] = (byType[r.type] ?? 0) + 1;
    }
    return { count, byType };
  }, [selectedPlace, receipts]);

  const locCount = useMemo(() => {
    if (!selected?.location) return 0;
    let n = 0;
    for (const r of receipts) if (r.location === selected.location) n += 1;
    return n;
  }, [selected?.location, receipts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel.current = true;
        stopNarration();
        select(null);
        selectEdge(null);
        selectPlace(null);
        setStoryPlaying(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select, selectEdge, selectPlace, setStoryPlaying]);

  const spanMin = useMemo(() => {
    if (path.length < 2) return 0;
    const t = path.map((r) => new Date(r.timestamp).getTime()).sort((a, b) => a - b);
    return Math.round((t[t.length - 1] - t[0]) / 60000);
  }, [path]);

  const why = useMemo(() => {
    if (selectedEdge) return selectedEdge.detail;
    if (selectedPlace && placeMix) {
      return `This location appears in ${placeMix.count.toLocaleString("en-IN")} official records.`;
    }
    if (!selected) return "";
    if (path.length > 1 && spanMin > 0 && spanMin < 24 * 60) {
      return `${path.length} receipts sit ${spanMin} minutes apart in the archive.`;
    }
    if (selected.location && locCount > 1) {
      return `This location appears in ${locCount.toLocaleString("en-IN")} different moments.`;
    }
    if (links.length > 0) {
      return `${links.length} stored relationship${links.length === 1 ? "" : "s"} connect this receipt to others.`;
    }
    return "This is an official record. No stored relationship was found among the capped connections.";
  }, [selectedEdge, selectedPlace, placeMix, selected, path.length, spanMin, locCount, links.length]);

  async function followStory() {
    if (!path.length) return;
    cancel.current = false;
    stopNarration();
    setStoryPlaying(true);
    for (const step of path) {
      if (cancel.current) break;
      select(step.id);
      await new Promise((r) => setTimeout(r, 1400));
    }
    setStoryPlaying(false);
    if (!cancel.current) {
      setToast(`${path.length} digital traces. One connected moment.`);
      window.setTimeout(() => setToast(null), 3600);
    }
  }

  const open = Boolean(selected || selectedEdge || selectedPlace);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-title"
          initial={{ x: 28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          className="glass pointer-events-auto fixed bottom-20 right-3 z-50 w-[min(23rem,calc(100vw-1.5rem))] max-h-[min(78vh,640px)] overflow-y-auto rounded-2xl p-5 md:bottom-6 md:right-6"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              {selectedPlace && !selected ? "Map the story" : "One connected moment"}
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                cancel.current = true;
                select(null);
                selectEdge(null);
                selectPlace(null);
              }}
              className="text-mute hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {selectedPlace && !selected && placeMix && (
            <>
              <p className="mt-3 text-2xl" aria-hidden>
                📍
              </p>
              <h2 id="story-title" className="mt-1 text-xl font-bold leading-tight">
                {selectedPlace}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
                {placeMix.count.toLocaleString("en-IN")} moments happened here
              </p>
              <ul className="mt-3 space-y-1 text-sm text-mute">
                {Object.entries(placeMix.byType).map(([type, n]) => (
                  <li key={type}>
                    {TYPE_ICON[type as ReceiptType]} {TYPE_LABEL[type as ReceiptType]} · {n}
                  </li>
                ))}
              </ul>
            </>
          )}

          {selected && (
            <>
              <p className="mt-3 text-2xl" aria-hidden>
                {TYPE_ICON[selected.type]}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: TYPE_COLOR[selected.type] }}>
                {TYPE_LABEL[selected.type]}
              </p>
              <h2 id="story-title" className="mt-1 text-xl font-bold leading-tight">
                {selected.title}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mute">
                {formatWhen(selected.timestamp)}
                {selected.location ? ` · ${selected.location}` : ""}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-mute">{selected.description}</p>
            </>
          )}

          {why && (
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                {selectedEdge ? "Why are these connected?" : "Why this matters"}
              </p>
              <p className="mt-2 text-sm text-white">{why}</p>
            </div>
          )}

          {path.length > 1 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-mute">Connected to</p>
              <ol className="mt-2 space-y-2">
                {path
                  .filter((r) => r.id !== selected?.id)
                  .map((r) => {
                    const edge = links.find((e) => selected && otherId(e, selected.id) === r.id);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => select(r.id)}
                          className="w-full rounded-xl border border-white/[0.08] px-3 py-2 text-left text-sm hover:border-accent/40"
                        >
                          {TYPE_ICON[r.type]} {r.title}
                          {edge ? <span className="mt-0.5 block text-[11px] text-mute">{edge.detail}</span> : null}
                        </button>
                      </li>
                    );
                  })}
              </ol>
              <p className="mt-3 text-xs text-mute">
                {path.length} digital traces
                {spanMin > 0 ? ` · ${spanMin} minutes` : ""}. We grouped them because the dataset links them by time,
                place, or shared fields.
              </p>
              <StorySpine path={path} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedPlace && !selected && (
              <button
                type="button"
                onClick={() => explorePlace(selectedPlace)}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
              >
                Explore these moments →
              </button>
            )}
            <button
              type="button"
              disabled={!selected && !selectedPlace}
              onClick={() => {
                if (selectedPlace && !selected) {
                  startNarration(buildPlaceNarration(selectedPlace, receipts));
                  return;
                }
                if (path.length) startNarration(buildMomentNarration(path));
              }}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
            >
              🔊 {storyPlaying ? "Telling your story" : "Tell the story"}
            </button>
            <button
              type="button"
              disabled={storyPlaying || path.length < 2}
              onClick={() => void followStory()}
              className="rounded-full border border-white/[0.12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute disabled:opacity-40"
            >
              {storyPlaying ? "Following…" : "Follow the story →"}
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => navigate(`/moment/${selected.id}`)}
                className="rounded-full border border-white/[0.12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute"
              >
                Open sequence
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function StorySpine({ path }: { path: Receipt[] }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-mute">The thread</p>
      <ol className="mt-2 space-y-1">
        {path.map((r, i) => (
          <li key={r.id} className="flex items-start gap-2 text-sm">
            <span className="w-6 shrink-0 text-center" aria-hidden>
              {TYPE_ICON[r.type]}
            </span>
            <span className="min-w-0 truncate">{r.title}</span>
            {i < path.length - 1 ? <span className="ml-auto text-mute">↓</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
