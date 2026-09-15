import React from 'react';
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconChart = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
  </svg>
);

export const IconTrophy = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6" />
  </svg>
);

export const IconDriver = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="M12 3v7M12 3 9 6M12 3l3 3M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <circle {...s} cx="12" cy="14" r="2.5" />
  </svg>
);

export const IconGear = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <circle {...s} cx="12" cy="12" r="3" />
    <path {...s} d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </svg>
);

export const IconClose = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <path {...s} d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconLock = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <rect {...s} x="5" y="10" width="14" height="10" rx="2" />
    <path {...s} d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
    <path {...s} strokeWidth="2.4" d="m5 12 5 5L19 7" />
  </svg>
);

export const IconSpark = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="m12 2 2.2 6.4L21 11l-6.8 2.6L12 20l-2.2-6.4L3 11l6.8-2.6L12 2Z" />
  </svg>
);

export const IconCursor = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path {...s} d="M6 3v13l3.4-3.2 2.3 5.4 2.6-1.1-2.3-5.3H17L6 3Z" />
  </svg>
);

export const IconGlobe = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <circle {...s} cx="12" cy="12" r="9" />
    <path {...s} d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18-2.5-2.7-2.5-15.3 0-18Z" />
  </svg>
);

export const IconClock = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <circle {...s} cx="12" cy="12" r="9" />
    <path {...s} d="M12 7v5l3.2 2" />
  </svg>
);

export function ChipArt({ rarity = 'common' }) {
  const palette = {
    common: { body: '#ffb547', edge: '#c07d12', core: '#fff0cd' },
    rare: { body: '#4dc8ff', edge: '#1a7fc4', core: '#d6f2ff' },
    legendary: { body: '#a97bff', edge: '#6b41c4', core: '#eadeff' },
  }[rarity];

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`cg-${rarity}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.core} />
          <stop offset="48%" stopColor={palette.body} />
          <stop offset="100%" stopColor={palette.edge} />
        </linearGradient>
      </defs>

      {/* pins */}
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i} fill={palette.edge}>
          <rect x={14 + i * 8} y="6" width="4" height="6" rx="1" />
          <rect x={14 + i * 8} y="52" width="4" height="6" rx="1" />
          <rect x="6" y={14 + i * 8} width="6" height="4" rx="1" />
          <rect x="52" y={14 + i * 8} width="6" height="4" rx="1" />
        </g>
      ))}

      <rect x="12" y="12" width="40" height="40" rx="5" fill={`url(#cg-${rarity})`} />
      <rect x="12" y="12" width="40" height="40" rx="5" fill="none" stroke={palette.core} strokeOpacity="0.55" />

      {/* die traces */}
      <g stroke={palette.edge} strokeOpacity="0.75" strokeWidth="1.4" fill="none">
        <rect x="22" y="22" width="20" height="20" rx="2" />
        <path d="M32 22v-6M32 42v6M22 32h-6M42 32h6" />
      </g>
      <circle cx="32" cy="32" r="4.2" fill={palette.core} />
    </svg>
  );
}

const MOTIFS = [
  // 0 — ring
  <g key="0"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2.6" /></g>,
  // 1 — triangle
  <g key="1"><path d="M12 5.5 19 18H5Z" fill="currentColor" /></g>,
  // 2 — diamond
  <g key="2"><path d="M12 4.5 19.5 12 12 19.5 4.5 12Z" fill="currentColor" /></g>,
  // 3 — hexagon
  <g key="3"><path d="M12 4.5 18.5 8.25v7.5L12 19.5 5.5 15.75v-7.5Z" fill="currentColor" /></g>,
  // 4 — chevrons
  <g key="4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="m7 15 5-5 5 5M7 9.5 12 5l5 4.5" />
  </g>,
  // 5 — cross
  <g key="5"><path d="M10 4.5h4V10h5.5v4H14v5.5h-4V14H4.5v-4H10Z" fill="currentColor" /></g>,
  // 6 — split square
  <g key="6">
    <rect x="5" y="5" width="6.2" height="6.2" rx="1" fill="currentColor" />
    <rect x="12.8" y="12.8" width="6.2" height="6.2" rx="1" fill="currentColor" />
    <rect x="12.8" y="5" width="6.2" height="6.2" rx="1" fill="currentColor" opacity="0.45" />
    <rect x="5" y="12.8" width="6.2" height="6.2" rx="1" fill="currentColor" opacity="0.45" />
  </g>,
  // 7 — starburst
  <g key="7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
  </g>,
];

function RankBars({ rank }) {
  const bars = [];
  const n = Math.min(7, Math.max(1, rank));
  const h = 2.5;
  const gap = 1.25;
  const totalH = n * h + (n - 1) * gap;
  let y = 12 - totalH / 2;
  for (let i = 0; i < n; i++) {
    const w = 7.5 + i * 1.7;
    bars.push(<rect key={i} x={12 - w / 2} y={y} width={w} height={h} rx={h / 2} fill="currentColor" />);
    y += h + gap;
  }
  return <g>{bars}</g>;
}

export function UpgradeGlyph({ categoryId, upgrade, index = 0, size = 30 }) {
  let hue;
  let content;

  if (categoryId === 'building') {
    hue = BUILDINGS[upgrade.buildingIndex].hue;
    content = <RankBars rank={upgrade.tier + 1} />;
  } else {
    hue = categoryId === 'click' ? 208 : categoryId === 'global' ? 158 : 42;
    // Shift hue slightly along the list so neighbours differ in colour too.
    hue += (index % 4) * 9;
    const offset = categoryId === 'click' ? 0 : categoryId === 'global' ? 3 : 6;
    content = MOTIFS[(index + offset) % MOTIFS.length];
  }

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ color: `hsl(${hue} 72% 58%)` }}>
      {content}
    </svg>
  );
}
