import React, { useRef } from 'react';
import { useRawFrame } from '../hooks/GameProvider.jsx';

export default function BuffStrip({ buffs }) {
  return (
    <div className="buff-strip" aria-live="polite">
      {buffs.map((buff) => (
        <BuffChip key={`${buff.effectId}-${buff.startedAt}`} buff={buff} />
      ))}
    </div>
  );
}

function BuffChip({ buff }) {
  const fillRef = useRef(null);
  const labelRef = useRef(null);
  const lastSecond = useRef(-1);

  const total = buff.expiresAt - buff.startedAt;
  const mult = buff.mult < 10 ? buff.mult.toFixed(1) : String(Math.round(buff.mult));

  useRawFrame(() => {
    const remaining = buff.expiresAt - Date.now();
    const progress = Math.max(0, Math.min(1, remaining / total));

    if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;

    const seconds = Math.max(0, Math.ceil(remaining / 1000));
    if (seconds !== lastSecond.current && labelRef.current) {
      lastSecond.current = seconds;
      labelRef.current.textContent =
        `${buff.label.toUpperCase()} x${mult} — ${seconds}s`;
    }
  });

  return (
    <div className="buff-chip" data-kind={buff.kind}>
      <span className="buff-chip-label" ref={labelRef}>
        {buff.label.toUpperCase()} x{mult}
      </span>
      <span className="buff-track">
        <span className="buff-chip-fill" ref={fillRef} />
      </span>
    </div>
  );
}
