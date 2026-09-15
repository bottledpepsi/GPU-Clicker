import { SAVE_KEY, SAVE_VERSION, OFFLINE, defaultSettings, migrate } from './state.js';
import { framesPerSecond } from './selectors.js';

const SETTINGS_KEY = 'gpuClicker.settings.v2';

export function saveGame(state, settings) {
  try {
    const payload = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      state: { ...state, lastSeenAt: Date.now() },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    // Quota or private-mode failures should not take the game down.
    console.warn('[gpu-clicker] save failed', err);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    const state = migrate(payload.state ?? payload);
    return { state, savedAt: payload.savedAt ?? state.lastSeenAt ?? Date.now() };
  } catch (err) {
    console.warn('[gpu-clicker] load failed', err);
    return null;
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* nothing useful to do */ }
}

const HEADER = 'GPUC2|';

export function exportSave(state) {
  const json = JSON.stringify({ version: SAVE_VERSION, state });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return HEADER + btoa(binary);
}

export function importSave(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed.startsWith(HEADER)) {
    throw new Error('That does not look like a GPU Clicker save string.');
  }
  let json;
  try {
    const binary = atob(trimmed.slice(HEADER.length));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    json = new TextDecoder().decode(bytes);
  } catch {
    throw new Error('The save string is damaged and could not be decoded.');
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The save string is damaged and could not be decoded.');
  }

  if (!parsed?.state?.buildings) {
    throw new Error('The save string is missing game data.');
  }
  return migrate(parsed.state);
}

export function computeOfflineProgress(state, savedAt, now = Date.now()) {
  const elapsedS = Math.max(0, (now - savedAt) / 1000);
  if (elapsedS < OFFLINE.MIN_SECONDS) return null;

  const cappedS = Math.min(elapsedS, OFFLINE.MAX_HOURS * 3600);
  const rate = framesPerSecond({ ...state, activeBuffs: [] }, 0);
  const earned = rate * cappedS * OFFLINE.EFFICIENCY;
  if (earned <= 0) return null;

  return {
    elapsedS,
    cappedS,
    capped: elapsedS > cappedS,
    rate,
    earned,
    efficiency: OFFLINE.EFFICIENCY,
  };
}
