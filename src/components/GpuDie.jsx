import React, { useCallback, useEffect, useRef, useState } from 'react';

const MAX_PARTICLES = 28;
let particleSeq = 0;

export default function GpuDie({ fps, clickValue, buffed, onClick, settings, formatFn }) {
  const buttonRef = useRef(null);
  const [particles, setParticles] = useState([]);

  const reduced = settings.reducedMotion;

  // Map output rate onto animation speed. Log scale, because fps spans ~20
  // orders of magnitude and a linear mapping would peg instantly.
  const intensity = fps > 0 ? Math.min(1, Math.log10(fps + 1) / 14) : 0;
  const sweepDur = `${(4.2 - intensity * 3.7).toFixed(2)}s`;
  const spinDur = `${(26 - intensity * 24).toFixed(2)}s`;
  const glow = (0.10 + intensity * 0.45).toFixed(3);

  const handleClick = useCallback((event) => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Keyboard activation has no coordinates — fall back to centre.
    const hasPoint = event.clientX !== 0 || event.clientY !== 0;
    const x = hasPoint ? event.clientX - rect.left : rect.width / 2;
    const y = hasPoint ? event.clientY - rect.top : rect.height / 2;

    onClick({ x: event.clientX, y: event.clientY });

    if (reduced) return;

    el.classList.remove('is-punched');
    // Force reflow so the animation restarts on rapid repeat clicks.
    void el.offsetWidth;
    el.classList.add('is-punched');

    const id = ++particleSeq;

    if (settings.particles) {
      setParticles((prev) => [
        ...prev.slice(-(MAX_PARTICLES - 1)),
        { id, x, y, label: `+${formatFn(clickValue)}` },
      ]);
    }
  }, [onClick, reduced, settings.particles, clickValue, formatFn]);

  // Sweep expired visuals rather than setting a timer per particle.
  useEffect(() => {
    if (!particles.length) return undefined;
    const t = setTimeout(() => setParticles((p) => p.slice(-4)), 1300);
    return () => clearTimeout(t);
  }, [particles.length]);

  return (
    <div className="die-field" data-buffed={buffed || undefined}>
      <div className="die-glow" style={{ opacity: glow }} aria-hidden="true" />

      <button
        ref={buttonRef}
        type="button"
        className="die-button"
        onClick={handleClick}
        aria-label={`Render a frame. Worth ${formatFn(clickValue)} frames per click.`}
        style={{ '--sweep-dur': sweepDur, '--spin-dur': spinDur }}
      >
        <DieArt />
      </button>

      <div className="particle-layer" aria-hidden="true">
        {particles.map((p) => (
          <span key={p.id} className="particle" style={{ left: p.x, top: p.y }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DieArt() {
  const tiles = [];
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      tiles.push(
        <rect
          key={`${x}-${y}`}
          x={74 + x * 26}
          y={74 + y * 26}
          width="21"
          height="21"
          rx="2.5"
          className="die-tile"
        />
      );
    }
  }

  return (
    <svg className="die-svg" viewBox="0 0 320 320" role="presentation">
      <defs>
        <linearGradient id="dieSub" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#252a1f" />
          <stop offset="100%" stopColor="#15180f" />
        </linearGradient>
        <linearGradient id="dieCore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#25331a" />
          <stop offset="100%" stopColor="#161d10" />
        </linearGradient>
        {/* The render pass: a bright band that travels across the die */}
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#76b900" stopOpacity="0" />
          <stop offset="42%" stopColor="#76b900" stopOpacity="0.14" />
          <stop offset="52%" stopColor="#9ade2a" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#76b900" stopOpacity="0" />
        </linearGradient>
        <clipPath id="dieClip">
          <rect x="70" y="70" width="180" height="180" rx="8" />
        </clipPath>
      </defs>

      {/* Cooling ring — rotates with output rate */}
      <g className="die-cooler">
        <circle cx="160" cy="160" r="146" fill="none" stroke="#2f3526" strokeWidth="2"
          strokeDasharray="14 10" />
        <circle cx="160" cy="160" r="134" fill="none" stroke="#3d5c16" strokeWidth="1.2"
          strokeDasharray="4 16" />
      </g>

      {/* Package substrate */}
      <rect x="40" y="40" width="240" height="240" rx="14" fill="url(#dieSub)"
        stroke="rgba(118,185,0,0.32)" strokeWidth="1.5" />

      {/* Board traces */}
      <g stroke="#333a28" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M40 100h26M40 160h26M40 220h26M254 100h26M254 160h26M254 220h26" />
        <path d="M100 40v26M160 40v26M220 40v26M100 254v26M160 254v26M220 254v26" />
      </g>

      {/* Memory modules around the die */}
      <g fill="#1b1f14" stroke="#333a28" strokeWidth="1">
        <rect x="58" y="58" width="196" height="10" rx="2" />
        <rect x="58" y="252" width="196" height="10" rx="2" />
        <rect x="58" y="68" width="10" height="184" rx="2" />
        <rect x="252" y="68" width="10" height="184" rx="2" />
      </g>

      {/* The die itself */}
      <rect x="70" y="70" width="180" height="180" rx="8" fill="url(#dieCore)"
        stroke="rgba(118,185,0,0.42)" strokeWidth="1.5" />

      <g clipPath="url(#dieClip)">
        <g className="die-tiles">{tiles}</g>
        {/* Sweep band, translated across by CSS */}
        <rect className="die-sweep" x="-48" y="66" width="48" height="190" fill="url(#sweep)" />
      </g>

      <rect x="70" y="70" width="180" height="180" rx="8" fill="none"
        stroke="#76b900" strokeOpacity="0.3" strokeWidth="1" />

      <text x="160" y="296" textAnchor="middle" className="die-mark">GPU-01</text>
    </svg>
  );
}
