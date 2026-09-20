import { useMemo, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useNarration, type NarrationRate } from "../../hooks/useNarration";
import { useLifeStore } from "../../store";
import { buildMomentNarration, buildPlaceNarration, startNarration, stopNarration } from "../../utils/narration";
import { buildStoryPath } from "../../utils/networkGraph";

const RATES: NarrationRate[] = [0.8, 1, 1.2];

export default function NarrationDock() {
  const n = useNarration();
  const [openSettings, setOpenSettings] = useState(false);
  const selectedId = useLifeStore((s) => s.selectedId);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const receipts = useLifeStore((s) => s.receipts);
  const edges = useLifeStore((s) => s.edges);
  const storyPlaying = useLifeStore((s) => s.storyPlaying);

  const path = useMemo(() => {
    const seed = receipts.find((r) => r.id === selectedId);
    return seed ? buildStoryPath(seed, receipts, edges, 5) : [];
  }, [receipts, edges, selectedId]);

  const canTell = path.length > 0 || Boolean(selectedPlace);
  const active = n.isSpeaking || n.isPaused || storyPlaying;
  if (!canTell && !active) return null;

  function tell() {
    if (selectedPlace && !selectedId) {
      startNarration(buildPlaceNarration(selectedPlace, receipts));
      return;
    }
    if (path.length) startNarration(buildMomentNarration(path));
  }

  const label = active ? (n.isPaused ? "Paused" : "Telling your story") : "Tell the story";

  return (
    <div className="pointer-events-auto fixed bottom-24 left-3 z-50 w-[min(20.5rem,calc(100vw-1.5rem))] md:bottom-6 md:left-6">
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
            className="rounded-full px-2 py-1.5 text-mute hover:text-white"
            aria-expanded={openSettings}
            aria-label="Voice settings"
          >
            <Volume2 size={14} />
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
            {n.currentText ? <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-mute">{n.currentText}</p> : null}
            <div className="mt-3 flex items-center gap-2">
              {n.isPaused ? (
                <button type="button" onClick={() => n.resume()} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Play size={11} className="mr-1 inline" /> Resume
                </button>
              ) : (
                <button type="button" onClick={() => n.pause()} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Pause size={11} className="mr-1 inline" /> Pause
                </button>
              )}
              <button
                type="button"
                onClick={() => stopNarration()}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute"
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
            className="mt-3 hidden w-full rounded-full bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white sm:block"
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
            <p className="text-[10px] uppercase tracking-[0.16em] text-mute">Voice</p>
            <select
              value={n.voiceURI}
              onChange={(e) => n.setVoiceURI(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#121218] px-2 py-1.5 text-xs outline-none"
            >
              <option value="">System voice</option>
              {n.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <div className="mt-3 flex gap-1">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => n.setRate(r)}
                  className={`flex-1 rounded-full border py-1 text-[10px] font-semibold ${
                    n.rate === r ? "border-accent text-white" : "border-white/10 text-mute"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-mute">
              Volume {Math.round(n.volume * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(n.volume * 100)}
                onChange={(e) => n.setVolume(Number(e.target.value) / 100)}
                className="flex-1 accent-[#7C6BFF]"
              />
            </label>
            <button
              type="button"
              onClick={() => n.setEnabled(!n.enabled)}
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
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
