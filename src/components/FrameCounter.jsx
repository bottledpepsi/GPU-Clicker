import React, { useRef } from 'react';
import { useRawFrame } from '../hooks/GameProvider.jsx';
import { formatFrames, formatNumber } from '../game/format.js';
import { framesPerSecond } from '../game/selectors.js';

const CONVERGENCE = 0.18;
const SNAP_RATIO = 0.0006;

export default function FrameCounter({ numberFormat }) {
  const valueRef = useRef(null);
  const rateRef = useRef(null);
  const displayed = useRef(null);
  const lastValue = useRef('');
  const lastRate = useRef('');

  useRawFrame((state) => {
    const target = state.frames;
    if (displayed.current === null) displayed.current = target;

    const gap = target - displayed.current;
    if (Math.abs(gap) <= Math.max(1, Math.abs(target) * SNAP_RATIO)) {
      displayed.current = target;
    } else {
      displayed.current += gap * CONVERGENCE;
    }

    const text = formatFrames(displayed.current, numberFormat);
    if (text !== lastValue.current) {
      lastValue.current = text;
      if (valueRef.current) valueRef.current.textContent = text;
    }

    const rate = formatNumber(framesPerSecond(state), numberFormat);
    if (rate !== lastRate.current) {
      lastRate.current = rate;
      if (rateRef.current) rateRef.current.textContent = rate;
    }
  });

  return (
    <div className="stage-head">
      <span className="frame-counter-label">Total Frames</span>
      <div className="frame-counter" aria-live="off">
        <span ref={valueRef}>0</span>
      </div>
      <span className="frame-counter-unit">
        <span ref={rateRef}>0</span> frames / sec
      </span>
    </div>
  );
}
