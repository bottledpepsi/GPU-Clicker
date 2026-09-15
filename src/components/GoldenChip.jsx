import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CHIP_CONFIG, pickChipEffect } from '../game/chips.js';
import { chipIntervalS, chipVisibleS } from '../game/selectors.js';

export default function GoldenChip({ state, onCollect, onMiss, reducedMotion }) {
  const [chip, setChip] = useState(null);
  const fieldRef = useRef(null);
  const spawnTimer = useRef(null);
  const hideTimer = useRef(null);

  // Read timing from live state without making the effect depend on it —
  // rescheduling on every tick would mean the chip never spawns.
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimers = () => {
    clearTimeout(spawnTimer.current);
    clearTimeout(hideTimer.current);
  };

  const scheduleNext = useCallback(() => {
    const base = chipIntervalS(stateRef.current);
    const jitter = (Math.random() - 0.5) * 2 * base * CHIP_CONFIG.JITTER;
    const delayMs = Math.max(8000, (base + jitter) * 1000);

    spawnTimer.current = setTimeout(() => {
      const effect = pickChipEffect();
      const field = fieldRef.current;
      const w = field?.clientWidth ?? 600;
      const h = field?.clientHeight ?? 400;

      // Bias toward the edges: pick a position, then push it away from centre.
      const size = 70;
      let x = Math.random() * (w - size);
      let y = Math.random() * (h - size);
      const cx = w / 2 - size / 2;
      const cy = h / 2 - size / 2;
      const pull = 0.45;
      x = x + (x - cx) * pull;
      y = y + (y - cy) * pull;
      x = Math.min(Math.max(8, x), Math.max(8, w - size - 8));
      y = Math.min(Math.max(8, y), Math.max(8, h - size - 8));

      const id = Date.now();
      setChip({ id, effect, x, y, leaving: false });

      hideTimer.current = setTimeout(() => {
        setChip((c) => (c && c.id === id ? { ...c, leaving: true } : c));
        setTimeout(() => {
          setChip((c) => (c && c.id === id ? null : c));
        }, 320);
        onMiss();
        scheduleNext();
      }, chipVisibleS(stateRef.current) * 1000);
    }, delayMs);
  }, [onMiss]);

  useEffect(() => {
    scheduleNext();
    return clearTimers;
  }, [scheduleNext]);

  const collect = (event) => {
    if (!chip || chip.leaving) return;
    clearTimeout(hideTimer.current);
    onCollect(chip.effect, { x: event.clientX, y: event.clientY });
    setChip({ ...chip, leaving: true });
    setTimeout(() => setChip(null), 320);
    scheduleNext();
  };

  return (
    <div className="chip-field" ref={fieldRef}>
      {chip && (
        <button
          type="button"
          className={`golden-chip${chip.leaving ? ' is-leaving' : ''}`}
          data-rarity={chip.effect.rarity}
          style={{
            left: chip.x,
            top: chip.y,
            animationPlayState: reducedMotion ? 'paused' : undefined,
          }}
          onClick={collect}
          aria-label={`Golden Chip — ${chip.effect.rarity} — ${chip.effect.label}. Click to collect.`}
          title={`${chip.effect.label}: ${chip.effect.blurb}`}
        >
          <span className="chip-glyph" aria-hidden="true">✦</span>
          <span className="chip-label">CHIP</span>
        </button>
      )}
    </div>
  );
}
