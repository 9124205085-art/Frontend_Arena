import { useEffect, useState } from "react";

export type NarrationRate = 0.8 | 1 | 1.2;

type Settings = {
  enabled: boolean;
  rate: NarrationRate;
  volume: number;
  voiceURI: string;
};

export type NarrationState = {
  supported: boolean;
  enabled: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  rate: NarrationRate;
  volume: number;
  voiceURI: string;
  voices: SpeechSynthesisVoice[];
  stepIndex: number;
  stepCount: number;
  currentText: string;
};

export type SpeakSequenceOptions = {
  onStep?: (index: number) => void;
  onDone?: (stopped: boolean) => void;
};

const SETTINGS_KEY = "life-narration-settings";
const RATES: NarrationRate[] = [0.8, 1, 1.2];

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { enabled: true, rate: 1, volume: 0.8, voiceURI: "" };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const rate = RATES.includes(parsed.rate as NarrationRate) ? (parsed.rate as NarrationRate) : 1;
    const volume = typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : 0.8;
    return {
      enabled: parsed.enabled !== false,
      rate,
      volume,
      voiceURI: typeof parsed.voiceURI === "string" ? parsed.voiceURI : "",
    };
  } catch {
    return { enabled: true, rate: 1, volume: 0.8, voiceURI: "" };
  }
}

function estimateMs(text: string, rate: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1600, Math.round((words / 2.35) * 1000) / rate + 350);
}

function pickVoice(voices: SpeechSynthesisVoice[], uri: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (uri) {
    const exact = voices.find((v) => v.voiceURI === uri);
    if (exact) return exact;
  }
  const ranked = [
    (v: SpeechSynthesisVoice) => /en-IN/i.test(v.lang) && /natural|neural|google|microsoft|neerja|sonia/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en-IN/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /en-GB/i.test(v.lang) && /google|microsoft|aria|sonia/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en-US/i.test(v.lang) && /google|microsoft|aria|jenny|samantha|natural/i.test(v.name),
    (v: SpeechSynthesisVoice) => /^en[-_]/i.test(v.lang) && v.localService,
    (v: SpeechSynthesisVoice) => /^en[-_]/i.test(v.lang),
  ];
  for (const test of ranked) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices.find((v) => v.default) ?? voices[0] ?? null;
}

class NarrationEngine {
  private listeners = new Set<() => void>();
  private synth: SpeechSynthesis | null = typeof window !== "undefined" ? window.speechSynthesis : null;
  private queue: { text: string; duration: number }[] = [];
  private index = -1;
  private timer: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStep: SpeakSequenceOptions["onStep"];
  private onDone: SpeakSequenceOptions["onDone"];
  private stopped = false;
  private gen = 0;

  supported = Boolean(this.synth);
  enabled: boolean;
  isSpeaking = false;
  isPaused = false;
  rate: NarrationRate;
  volume: number;
  voiceURI: string;
  voices: SpeechSynthesisVoice[] = [];
  currentText = "";

  constructor() {
    const s = typeof window !== "undefined" ? loadSettings() : { enabled: true, rate: 1 as const, volume: 0.8, voiceURI: "" };
    this.enabled = s.enabled;
    this.rate = s.rate;
    this.volume = s.volume;
    this.voiceURI = s.voiceURI;
    if (typeof window !== "undefined") {
      this.refreshVoices();
      this.synth?.addEventListener("voiceschanged", () => this.refreshVoices());
    }
  }

  get stepIndex() {
    return this.index;
  }

  get stepCount() {
    return this.queue.length;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private persist() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          enabled: this.enabled,
          rate: this.rate,
          volume: this.volume,
          voiceURI: this.voiceURI,
        }),
      );
    } catch {
      /* ignore quota */
    }
  }

  private refreshVoices() {
    this.voices = this.synth?.getVoices() ?? [];
    if (!this.voiceURI) {
      const preferred = pickVoice(this.voices, "");
      if (preferred) this.voiceURI = preferred.voiceURI;
    }
    this.emit();
  }

  snapshot(): NarrationState {
    return {
      supported: this.supported,
      enabled: this.enabled,
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      rate: this.rate,
      volume: this.volume,
      voiceURI: this.voiceURI,
      voices: this.voices,
      stepIndex: this.index,
      stepCount: this.queue.length,
      currentText: this.currentText,
    };
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
    this.persist();
    this.emit();
  }

  setRate(rate: NarrationRate) {
    this.rate = rate;
    this.persist();
    this.emit();
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.persist();
    this.emit();
  }

  setVoiceURI(voiceURI: string) {
    this.voiceURI = voiceURI;
    this.persist();
    this.emit();
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.speakSequence([{ text, duration: estimateMs(text, this.rate) }], {
        onDone: () => resolve(),
      });
    });
  }

  speakSequence(steps: { text: string; duration?: number }[], opts: SpeakSequenceOptions = {}) {
    this.stopInternal(false);
    this.stopped = false;
    this.queue = steps
      .map((s) => ({ text: s.text.trim(), duration: s.duration ?? estimateMs(s.text, this.rate) }))
      .filter((s) => s.text.length > 0);
    this.onStep = opts.onStep;
    this.onDone = opts.onDone;
    if (!this.queue.length) {
      opts.onDone?.(false);
      return;
    }
    this.isSpeaking = true;
    this.isPaused = false;
    this.playIndex(0);
  }

  pause() {
    if (!this.isSpeaking || this.isPaused) return;
    this.isPaused = true;
    this.clearTimer();
    try {
      this.synth?.pause();
    } catch {
      /* some engines throw */
    }
    this.emit();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    try {
      if (this.synth?.paused) this.synth.resume();
      else this.armTimer(this.queue[this.index]?.duration ?? 2000, this.gen);
    } catch {
      this.armTimer(this.queue[this.index]?.duration ?? 2000, this.gen);
    }
    this.emit();
  }

  stop() {
    this.stopInternal(true);
  }

  private stopInternal(notify: boolean) {
    this.gen += 1;
    this.clearTimer();
    this.stopped = true;
    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }
    const wasActive = this.isSpeaking;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.index = -1;
    this.queue = [];
    this.currentText = "";
    this.emit();
    if (notify && wasActive) this.onDone?.(true);
    this.onStep = undefined;
    this.onDone = undefined;
  }

  private playIndex(i: number) {
    if (this.stopped) return;
    if (i >= this.queue.length) {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentText = "";
      this.emit();
      this.onDone?.(false);
      this.onStep = undefined;
      this.onDone = undefined;
      return;
    }
    const token = ++this.gen;
    this.index = i;
    const step = this.queue[i];
    this.currentText = step.text;
    this.onStep?.(i);
    this.emit();

    const canSpeak = this.supported && this.enabled && Boolean(this.synth);
    if (!canSpeak) {
      this.armTimer(step.duration, token);
      return;
    }

    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }

    const utterance = new SpeechSynthesisUtterance(step.text);
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    const voice = pickVoice(this.voices, this.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-IN";
    utterance.onend = () => {
      if (token !== this.gen || this.stopped || this.isPaused) return;
      this.clearTimer();
      this.playIndex(i + 1);
    };
    utterance.onerror = () => {
      if (token !== this.gen || this.stopped) return;
      this.armTimer(Math.min(step.duration, 1200), token);
    };
    this.currentUtterance = utterance;
    this.synth?.speak(utterance);
    this.armTimer(step.duration + 1800, token);
  }

  private armTimer(ms: number, token: number) {
    this.clearTimer();
    this.timer = window.setTimeout(() => {
      if (token !== this.gen || this.stopped || this.isPaused) return;
      this.playIndex(this.index + 1);
    }, ms);
  }

  private clearTimer() {
    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

const engine = new NarrationEngine();

export function getNarrationEngine() {
  return engine;
}

export function estimateNarrationDuration(text: string, rate = 1) {
  return estimateMs(text, rate);
}

export function useNarration() {
  const [, bump] = useState(0);
  useEffect(() => engine.subscribe(() => bump((n) => n + 1)), []);
  const snap = engine.snapshot();
  return {
    ...snap,
    speak: (text: string) => engine.speak(text),
    speakSequence: engine.speakSequence.bind(engine),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    stop: () => engine.stop(),
    setEnabled: (v: boolean) => engine.setEnabled(v),
    setRate: (v: NarrationRate) => engine.setRate(v),
    setVolume: (v: number) => engine.setVolume(v),
    setVoiceURI: (v: string) => engine.setVoiceURI(v),
  };
}
