import type { Chapter } from "../data/types";
import {
  buildChapterNarration,
  buildMomentNarration,
  buildPatternNarration,
  buildPlaceNarration,
  type NarrationStep,
} from "../domain/narration";
import { getPatternTraceIds } from "../domain/insights";
import { patternNetworkLens } from "../domain/story";
import { getNarrationEngine } from "./useNarration";
import { useLifeStore } from "../store";

function uniqueIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function applyVisual(s: NarrationStep) {
  const store = useLifeStore.getState();
  if (s.nodeId) {
    store.select(s.nodeId);
    return;
  }
  if (s.highlightIds?.length) {
    store.applyTrace(s.highlightIds);
    store.select(null);
  }
}

/**
 * Play a narration sequence: highlight the matching node as each utterance starts.
 * Must be called from a user gesture so SpeechSynthesis is allowed.
 * Voice never starts on page load.
 */
export function startNarration(steps: NarrationStep[]) {
  const engine = getNarrationEngine();
  const store = useLifeStore.getState();
  if (!steps.length) {
    store.setToast("There is not enough of a connected story to narrate yet.");
    window.setTimeout(() => store.setToast(null), 2800);
    return;
  }

  const cluster = uniqueIds(steps.flatMap((s) => [s.nodeId, ...(s.highlightIds ?? [])]));
  if (cluster.length) store.applyTrace(cluster);
  store.setStoryPlaying(true);
  applyVisual(steps[0]);

  if (!engine.supported) {
    store.setToast("Voice narration isn't supported in this browser. You can still explore the story visually.");
    window.setTimeout(() => store.setToast(null), 4200);
  } else if (!engine.enabled) {
    store.setToast("Narration is off. The network will still follow the story.");
    window.setTimeout(() => store.setToast(null), 2800);
  }

  engine.speakSequence(steps, {
    onStep: (i) => applyVisual(steps[i]),
    onDone: (stopped) => {
      const st = useLifeStore.getState();
      st.setStoryPlaying(false);
      if (!stopped && cluster.length) {
        st.applyTrace(cluster);
        st.select(null);
        st.setToast(`${cluster.length} digital traces. One connected story.`);
        window.setTimeout(() => {
          if (useLifeStore.getState().toast?.includes("connected story")) useLifeStore.getState().setToast(null);
        }, 3600);
      }
    },
  });
}

export function stopNarration() {
  getNarrationEngine().stop();
  useLifeStore.getState().setStoryPlaying(false);
}

export function applyPatternTrace(patternId: string) {
  const store = useLifeStore.getState();
  const lens = patternNetworkLens(patternId);
  if (lens.networkMode) {
    store.setNetworkMode(lens.networkMode);
    return;
  }
  if (lens.hourLens) store.setHourLens(lens.hourLens);
  store.applyTrace(getPatternTraceIds(store.receipts, patternId));
}

export function startPatternNarration(patternId: string) {
  const store = useLifeStore.getState();
  const lens = patternNetworkLens(patternId);
  if (lens.hourLens) store.setHourLens(lens.hourLens);
  const rate = getNarrationEngine().rate;
  startNarration(buildPatternNarration(patternId, store.receipts, rate));
}

export function startChapterNarration(chapter: Chapter) {
  const rate = getNarrationEngine().rate;
  startNarration(buildChapterNarration(chapter, useLifeStore.getState().receipts, rate));
}

export function tellSelectedStory(input: { place?: string | null; path: Parameters<typeof buildMomentNarration>[0] }) {
  const rate = getNarrationEngine().rate;
  const receipts = useLifeStore.getState().receipts;
  if (input.place) {
    startNarration(buildPlaceNarration(input.place, receipts, rate));
    return;
  }
  if (input.path.length) startNarration(buildMomentNarration(input.path, rate));
}
