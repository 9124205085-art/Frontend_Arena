import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useNarration, type NarrationRate } from "../../hooks/useNarration";
import { useLifeStore } from "../../store";
import { buildStoryPath } from "../../domain/graph";
import { stopNarration, tellSelectedStory } from "../../hooks/storyPlayback";
import { useIsMobile } from "../../hooks/useIsMobile";

const RATES: NarrationRate[] = [0.8, 1, 1.2];

export default function NarrationDock() {
  const n = useNarration();
  const [openSettings, setOpenSettings] = useState(false);
  const selectedId = useLifeStore((s) => s.selectedId);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const storyPlaying = useLifeStore((s) => s.storyPlaying);
  const compact = useIsMobile(1024);

  const path = useMemo(() => {
    const seed = selectedId ? useLifeStore.getState().receiptById.get(selectedId) : undefined;
    return seed ? buildStoryPath(seed, receipts, edges, 5) : [];
  }, [receipts, edges, selectedId]);

  const canTell = path.length > 0 || Boolean(selectedPlace);
  const active = n.isSpeaking || n.isPaused || storyPlaying;
  const panelOpen = Boolean(selectedId || selectedPlace);

  useEffect(() => {
    const show = compact && active;
    document.documentElement.style.setProperty("--dock-h", show ? "8.25rem" : "0px");
    return () => document.documentElement.style.setProperty("--dock-h", "0px");
  }, [compact, active]);

  if (!canTell && !active) return null;
  if (compact && panelOpen && !active) return null;

  function tell() {
    tellSelectedStory({
      place: selectedPlace && !selectedId ? selectedPlace : null,
      path,
    });
  }

  const label = active ? (n.isPaused ? "Paused" : "Telling your story") : "Tell the story";

  return (
    <div
      className={
        compact
          ? "pointer-events-auto fixed inset-x-3 z-50"
          : "pointer-events-auto fixed bottom-6 left-6 z-50 w-[min(20.5rem,calc(100vw-3rem))]"
      }
      style={compact ? { bottom: "calc(var(--nav-h) + 0.45rem)" } : undefined}
    >
      <div className="glass rounded-2xl p-3 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={active ? "Narration controls" : "Tell the story"}
            onClick={() => {
              if (!active) tell();
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-lg"
          >
            🔊
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              {active ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  {label}
                </span>
              ) : (
                "Tell the story"
              )}
            </p>
            {active ? <Waveform playing={n.isSpeaking && !n.isPaused} /> : <p className="mt-0.5 truncate text-[11px] text-mute">Voice from the records on screen</p>}
          </div>
          <button
            type="button"
            onClick={() => setOpenSettings((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-white"
            aria-expanded={openSettings}
            aria-label="Voice settings"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {active && (
          <>
            <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-accent/80 transition-[width] duration-500"
                style={{ width: n.stepCount ? `${((n.stepIndex + 1) / n.stepCount) * 100}%` : "8%" }}
              />
            </div>
            {n.currentText ? (
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-mute" aria-live="polite">
                {n.currentText}
              </p>
            ) : null}
            {n.stepCount > 0 ? (
              <p className="sr-only" aria-live="polite">
                Narration step {n.stepIndex + 1} of {n.stepCount}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {n.isPaused ? (
                <button type="button" onClick={() => n.resume()} className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Play size={11} className="mr-1 inline" /> Resume
                </button>
              ) : (
                <button type="button" onClick={() => n.pause()} className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Pause size={11} className="mr-1 inline" /> Pause
                </button>
              )}
              <button
                type="button"
                onClick={() => stopNarration()}
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute"
              >
                <Square size={10} className="mr-1 inline" /> Stop
              </button>
            </div>
          </>
        )}

        {!active && (
          <button
            type="button"
            onClick={tell}
            className="mt-3 min-h-11 w-full rounded-full bg-accent px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
          >
            Tell the story
          </button>
        )}

        {openSettings && (
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            {!n.supported && (
              <p className="mb-2 text-[11px] leading-relaxed text-mute">
                Voice narration isn't supported in this browser. You can still explore the story visually.
              </p>
            )}
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.16em] text-mute">Voice</span>
              <select
                value={n.voiceURI}
                onChange={(e) => n.setVoiceURI(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#121218] px-2 py-1.5 text-base outline-none md:text-xs"
              >
              <option value="">System voice</option>
              {n.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            </label>
            <div className="mt-3 flex gap-1" role="group" aria-label="Narration speed">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={n.rate === r}
                  onClick={() => n.setRate(r)}
                  className={`min-h-11 flex-1 rounded-full border text-[10px] font-semibold ${
                    n.rate === r ? "border-accent text-white" : "border-white/10 text-mute"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-mute">
              Volume {Math.round(n.volume * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(n.volume * 100)}
                onChange={(e) => n.setVolume(Number(e.target.value) / 100)}
                className="h-11 flex-1 accent-[#7C6BFF]"
              />
            </label>
            <button
              type="button"
              onClick={() => n.setEnabled(!n.enabled)}
              className="mt-3 min-h-11 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
            >
              {n.enabled ? "Disable narration" : "Enable narration"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="mt-1 flex h-3 items-end gap-0.5" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-accent/80 ${playing ? "narration-bar" : "h-1 opacity-40"}`}
          style={{ animationDelay: `${i * 0.08}s`, height: playing ? undefined : 4 }}
        />
      ))}
    </div>
  );
}
