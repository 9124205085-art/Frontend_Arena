import { useEffect, useRef } from "react";

/**
 * Soft wind from filtered white noise. No audio asset required.
 */
export function useWindAudio(on: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!on) {
      gainRef.current?.gain.exponentialRampToValueAtTime(0.0001, (ctxRef.current?.currentTime || 0) + 0.4);
      window.setTimeout(() => {
        srcRef.current?.stop();
        srcRef.current = null;
      }, 450);
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new AudioCtx();
    ctxRef.current = ctx;
    void ctx.resume();

    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.8);

    srcRef.current = src;
    gainRef.current = gain;

    return () => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [on]);
}
