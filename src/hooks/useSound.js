import { useCallback, useRef } from 'react';

const VOICES = {
  click: { freq: 520, to: 680, dur: 0.055, type: 'triangle', gain: 0.045 },
  buy: { freq: 320, to: 540, dur: 0.11, type: 'square', gain: 0.04 },
  upgrade: { freq: 440, to: 880, dur: 0.16, type: 'triangle', gain: 0.05 },
  chip: { freq: 700, to: 1400, dur: 0.24, type: 'sine', gain: 0.07 },
  achievement: { freq: 600, to: 900, dur: 0.3, type: 'sine', gain: 0.06 },
  prestige: { freq: 200, to: 620, dur: 0.5, type: 'sawtooth', gain: 0.05 },
};

export function useSound(enabled) {
  const ctxRef = useRef(null);
  const lastPlay = useRef(0);

  return useCallback((voice) => {
    if (!enabled) return;
    const spec = VOICES[voice];
    if (!spec) return;

    // Rate limit: held-down clicking should not stack 20 oscillators.
    const now = performance.now();
    if (voice === 'click' && now - lastPlay.current < 45) return;
    lastPlay.current = now;

    try {
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        ctxRef.current = new Ctx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = spec.type;
      osc.frequency.setValueAtTime(spec.freq, t);
      osc.frequency.exponentialRampToValueAtTime(spec.to, t + spec.dur);

      gain.gain.setValueAtTime(spec.gain, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + spec.dur + 0.02);
    } catch {
      // Audio is never important enough to break the game over.
    }
  }, [enabled]);
}
