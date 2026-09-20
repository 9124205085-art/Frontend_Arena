import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useLifeStore } from "../../store";
import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import { formatWhen } from "../../utils/format";
import { otherId } from "../../data/connectionEngine";
import { buildStoryPath } from "../../domain/graph";
import { explainSelection, pathSpanMinutes } from "../../domain/story";
import { stopNarration, tellSelectedStory } from "../../hooks/storyPlayback";
import type { ConnectionEdge, Receipt, ReceiptType } from "../../data/types";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const EMPTY_EDGES: ConnectionEdge[] = [];

export default function StoryPanel() {
  const navigate = useNavigate();
  const selectedEdge = useLifeStore((s) => s.selectedEdge);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const selected = useLifeStore((s) => (s.selectedId ? (s.receiptById.get(s.selectedId) ?? null) : null));
  const links = useLifeStore((s) => {
    if (!s.selectedId) return EMPTY_EDGES;
    return s.edgesByNode.get(s.selectedId) ?? EMPTY_EDGES;
  });
  const locationStats = useLifeStore((s) => s.locationStats);
  const select = useLifeStore((s) => s.select);
  const selectEdge = useLifeStore((s) => s.selectEdge);
  const selectPlace = useLifeStore((s) => s.selectPlace);
  const explorePlace = useLifeStore((s) => s.explorePlace);
  const storyPlaying = useLifeStore((s) => s.storyPlaying);
  const setStoryPlaying = useLifeStore((s) => s.setStoryPlaying);
  const setToast = useLifeStore((s) => s.setToast);
  const cancel = useRef(false);
  const sheet = useIsMobile(1024);
  const reduced = usePrefersReducedMotion();

  const dismiss = useCallback(() => {
    cancel.current = true;
    stopNarration();
    select(null);
    selectEdge(null);
    selectPlace(null);
    setStoryPlaying(false);
  }, [select, selectEdge, selectPlace, setStoryPlaying]);

  const path = useMemo(() => {
    if (!selected) return [];
    const { receipts, edges } = useLifeStore.getState();
    return buildStoryPath(selected, receipts, edges, 5);
  }, [selected]);

  const placeMix = useMemo(() => {
    if (!selectedPlace) return null;
    const hit = locationStats.find((l) => l.location === selectedPlace);
    return hit ? { count: hit.count, byType: hit.byType } : null;
  }, [selectedPlace, locationStats]);

  const locCount = selected?.location
    ? (locationStats.find((l) => l.location === selected.location)?.count ?? 0)
    : 0;

  const spanMin = useMemo(() => pathSpanMinutes(path), [path]);

  const why = useMemo(
    () =>
      explainSelection({
        edgeDetail: selectedEdge?.detail,
        placeCount: selectedPlace && placeMix ? placeMix.count : null,
        hasReceipt: Boolean(selected),
        pathLength: path.length,
        spanMin,
        locationCount: locCount,
        linkCount: links.length,
      }),
    [selectedEdge, selectedPlace, placeMix, selected, path.length, spanMin, locCount, links.length],
  );

  async function followStory() {
    if (!path.length) return;
    cancel.current = false;
    stopNarration();
    setStoryPlaying(true);
    const wait = reduced ? 0 : 1400;
    for (const step of path) {
      if (cancel.current) break;
      select(step.id);
      if (wait) await new Promise((r) => setTimeout(r, wait));
    }
    setStoryPlaying(false);
    if (!cancel.current) {
      setToast(`${path.length} digital traces. One connected moment.`);
      window.setTimeout(() => setToast(null), 3600);
    }
  }

  const open = Boolean(selected || selectedEdge || selectedPlace);
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, open, dismiss);

  return (
    <AnimatePresence>
      {open && (
        <>
          {sheet && (
            <motion.button
              type="button"
              aria-label="Dismiss story"
              className="fixed inset-0 z-[45] bg-black/55 lg:hidden"
              initial={reduced ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              onClick={dismiss}
            />
          )}
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-title"
            initial={reduced ? { opacity: 0 } : sheet ? { y: 48, opacity: 0 } : { x: 28, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : sheet ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : sheet ? { y: 32, opacity: 0 } : { x: 20, opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={
              sheet
                ? "story-sheet glass pointer-events-auto fixed inset-x-0 z-50 max-h-[min(58dvh,32rem)] overflow-y-auto rounded-t-3xl px-4 pb-5 pt-2"
                : "glass pointer-events-auto fixed bottom-6 right-6 z-50 w-[min(23rem,calc(100vw-3rem))] max-h-[min(78vh,640px)] overflow-y-auto rounded-2xl p-5"
            }
          >
          {sheet && <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/30" aria-hidden />}
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {selectedPlace && !selected ? "Map the story" : "One connected moment"}
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={dismiss}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mute hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {selectedPlace && !selected && !placeMix && (
            <h2 id="story-title" className="mt-3 text-xl font-bold leading-tight">
              {selectedPlace}
            </h2>
          )}

          {!selected && !selectedPlace && (
            <h2 id="story-title" className="mt-3 text-xl font-bold leading-tight">
              {selectedEdge ? "Why these moments connect" : "Story"}
            </h2>
          )}

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
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: TYPE_COLOR[selected.type] }}>
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {selectedEdge ? "Why are these connected?" : "Why this matters"}
              </p>
              <p className="mt-2 text-sm text-white">{why}</p>
            </div>
          )}

          {path.length > 1 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-mute">Connected to</p>
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
                          className="min-h-11 w-full rounded-xl border border-white/[0.08] px-3 py-2 text-left text-sm transition hover:border-accent/40 hover:bg-white/[0.05]"
                        >
                          {TYPE_ICON[r.type]} {r.title}
                          {edge ? <span className="mt-0.5 block text-xs text-mute">{edge.detail}</span> : null}
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
                className="min-h-11 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Explore these moments →
              </button>
            )}
            <button
              type="button"
              disabled={!selected && !selectedPlace}
              onClick={() =>
                tellSelectedStory({
                  place: selectedPlace && !selected ? selectedPlace : null,
                  path,
                })
              }
              className="min-h-11 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              🔊 {storyPlaying ? "Telling your story" : "Tell the story"}
            </button>
            <button
              type="button"
              disabled={storyPlaying || path.length < 2}
              onClick={() => void followStory()}
              className="min-h-11 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-accent/50 hover:text-white disabled:opacity-40"
            >
              {storyPlaying ? "Following…" : "Follow the story →"}
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => navigate(`/moment/${selected.id}`)}
                className="min-h-11 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
              >
                Open sequence
              </button>
            )}
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function StorySpine({ path }: { path: Receipt[] }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-mute">The thread</p>
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
