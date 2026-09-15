import { BUILDINGS } from './buildings.js';

export const SAVE_KEY = 'gpuClicker.save.v2';
export const SAVE_VERSION = 2;
export const AUTOSAVE_INTERVAL_MS = 15_000;

export const OFFLINE = {
  MAX_HOURS: 12,
  EFFICIENCY: 0.5, // idle production runs at half rate while the tab is closed
  MIN_SECONDS: 60, // below this, do not bother the player with a modal
};

export function defaultSettings() {
  return {
    numberFormat: 'short',   // 'short' | 'scientific' | 'raw'
    reducedMotion: false,
    particles: true,
    sound: true,
    showFpsInTitle: false,
    buyQuantity: 1,          // 1 | 10 | 100 | 'max'
  };
}

export function defaultState() {
  return {
    version: SAVE_VERSION,

    // Economy
    frames: 0,
    lifetimeFrames: 0,
    lifetimeFramesAllTime: 0, // survives prestige, for stats only

    // Hardware
    buildings: BUILDINGS.map(() => ({ owned: 0 })),

    // Owned upgrade keys
    buildingUpgrades: {},
    clickUpgrades: {},
    globalUpgrades: {},
    chipUpgrades: {},
    achievements: {},

    // Prestige
    driverPoints: 0,
    prestigeCount: 0,

    // Golden Chip
    chipsCollected: 0,
    chipsMissed: 0,
    chipStreak: 0,
    bestChipStreak: 0,
    lastChipCaughtAt: 0,
    activeBuffs: [],       // { effectId, kind, mult, expiresAt, label }

    // Stats
    totalClicks: 0,
    framesFromClicks: 0,
    peakFps: 0,
    playtimeS: 0,
    longestOfflineS: 0,
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
  };
}

export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  const merged = { ...base, ...raw };

  merged.buildings = BUILDINGS.map((_, i) => ({
    owned: Math.max(0, Math.floor(raw.buildings?.[i]?.owned ?? 0)),
  }));

  for (const key of ['buildingUpgrades', 'clickUpgrades', 'globalUpgrades', 'chipUpgrades', 'achievements']) {
    merged[key] = { ...(raw[key] ?? {}) };
  }

  merged.activeBuffs = Array.isArray(raw.activeBuffs) ? raw.activeBuffs : [];
  merged.version = SAVE_VERSION;

  // Numeric hygiene — a corrupted save should degrade, not produce NaN.
  for (const key of [
    'frames', 'lifetimeFrames', 'lifetimeFramesAllTime', 'driverPoints',
    'prestigeCount', 'chipsCollected', 'chipsMissed', 'chipStreak',
    'bestChipStreak', 'totalClicks', 'framesFromClicks', 'peakFps',
    'playtimeS', 'longestOfflineS',
  ]) {
    const v = Number(merged[key]);
    merged[key] = Number.isFinite(v) && v >= 0 ? v : 0;
  }

  return merged;
}
