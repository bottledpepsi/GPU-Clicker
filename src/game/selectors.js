import { BUILDINGS, unitCost, bulkCost, maxAffordable } from './buildings.js';
import {
  BUILDING_UPGRADES, CLICK_UPGRADES, GLOBAL_UPGRADES, CHIP_UPGRADES,
} from './upgrades.js';
import { CHIP_CONFIG } from './chips.js';
import { ACHIEVEMENTS } from './achievements.js';

// Precomputed index so per-building multipliers are not an O(90) scan per frame.
const UPGRADES_BY_BUILDING = BUILDINGS.map((_, i) =>
  BUILDING_UPGRADES.filter((u) => u.buildingIndex === i)
);

export function totalOwned(state) {
  let n = 0;
  for (const b of state.buildings) n += b.owned;
  return n;
}

export function achievementsEarned(state) {
  return Object.keys(state.achievements).length;
}

export const PRESTIGE_DIVISOR = 1e12;

export function driverPointsFor(lifetimeFrames) {
  return Math.floor(Math.cbrt(Math.max(0, lifetimeFrames) / PRESTIGE_DIVISOR));
}

export function prestigeGain(state) {
  return Math.max(0, driverPointsFor(state.lifetimeFrames) - state.driverPoints);
}

export function framesForNextPoint(state) {
  const next = driverPointsFor(state.lifetimeFrames) + 1;
  return Math.pow(next, 3) * PRESTIGE_DIVISOR;
}

export function activeBuffs(state, now = Date.now()) {
  return state.activeBuffs.filter((b) => b.expiresAt > now);
}

function buffMultiplier(state, kind, now) {
  let m = 1;
  for (const b of state.activeBuffs) {
    if (b.kind === kind && b.expiresAt > now) m *= b.mult;
  }
  return m;
}

export function buildingMultiplier(state, index) {
  let m = 1;
  for (const u of UPGRADES_BY_BUILDING[index]) {
    if (state.buildingUpgrades[u.key]) m *= u.multiplier;
  }
  return m;
}

export function buildingUnitOutput(state, index, now = Date.now()) {
  return BUILDINGS[index].baseFps * buildingMultiplier(state, index) * globalMultiplier(state, now);
}

export function buildingOutput(state, index, now = Date.now()) {
  return state.buildings[index].owned * buildingUnitOutput(state, index, now);
}

export function driverMultiplier(state) {
  let perPoint = 0.01;
  if (state.globalUpgrades.gDriver) perPoint += 0.01;
  return 1 + state.driverPoints * perPoint;
}

export function globalMultiplier(state, now = Date.now()) {
  let m = 1;
  for (const u of GLOBAL_UPGRADES) {
    if (!state.globalUpgrades[u.key]) continue;
    if (u.special === 'perDriverPoint') continue; // folded into driverMultiplier
    if (u.special === 'perAchievement') m *= 1 + achievementsEarned(state) * 0.02;
    else m *= u.mult;
  }
  m *= driverMultiplier(state);
  m *= buffMultiplier(state, 'production', now);
  return m;
}

export function framesPerSecond(state, now = Date.now()) {
  let raw = 0;
  for (let i = 0; i < BUILDINGS.length; i++) {
    const owned = state.buildings[i].owned;
    if (owned > 0) raw += owned * BUILDINGS[i].baseFps * buildingMultiplier(state, i);
  }
  return raw * globalMultiplier(state, now);
}

export function baseFramesPerSecond(state) {
  const stripped = { ...state, activeBuffs: [] };
  return framesPerSecond(stripped, 0);
}

export function clickValue(state, now = Date.now()) {
  let m = 1;
  for (const u of CLICK_UPGRADES) {
    if (!state.clickUpgrades[u.key]) continue;
    if (u.special === 'perBuilding') m *= 1 + totalOwned(state) * 0.01;
    else if (!u.special) m *= u.mult;
  }

  // Click inherits global production scaling, so clicking never dead-ends.
  let value = m * globalMultiplier(state, now);

  // Flat additions from passive output, applied after multipliers.
  if (state.clickUpgrades.clickIdle) {
    const share = state.clickUpgrades.clickIdle2 ? 10 : 1;
    value += framesPerSecond(state, now) * share;
  }

  value *= buffMultiplier(state, 'click', now);
  return Math.max(1, value);
}

export function chipRateLevel(state) {
  return CHIP_UPGRADES.filter((u) => u.effect === 'rate' && state.chipUpgrades[u.key]).length;
}

export function chipMagnitudeBonus(state) {
  const levels = CHIP_UPGRADES.filter((u) => u.effect === 'magnitude' && state.chipUpgrades[u.key]).length;
  return Math.pow(1.5, levels);
}

export function chipIntervalS(state) {
  return Math.max(
    CHIP_CONFIG.MIN_INTERVAL_S,
    CHIP_CONFIG.BASE_INTERVAL_S / Math.pow(2, chipRateLevel(state))
  );
}

export function chipVisibleS(state) {
  const extra = CHIP_UPGRADES
    .filter((u) => u.effect === 'duration' && state.chipUpgrades[u.key])
    .length * 8;
  return CHIP_CONFIG.VISIBLE_S + extra;
}

export function resolveBuyCount(state, index, quantity) {
  const building = BUILDINGS[index];
  const owned = state.buildings[index].owned;
  if (quantity === 'max') return maxAffordable(building, owned, state.frames);
  return quantity;
}

export function buildingPurchaseInfo(state, index, quantity, now = Date.now()) {
  const building = BUILDINGS[index];
  const owned = state.buildings[index].owned;
  const requested = quantity === 'max' ? maxAffordable(building, owned, state.frames) : quantity;

  // When "Max" resolves to nothing affordable we still price a single unit,
  // otherwise the row would advertise a cost of 0 and read as free.
  const count = Math.max(1, requested);
  const cost = bulkCost(building, owned, count);
  const perUnit = buildingUnitOutput(state, index, now);

  return {
    count,
    cost,
    unitCost: unitCost(building, owned),
    perUnit,
    affordable: requested > 0 && state.frames >= cost,
    // Seconds for this purchase to pay for itself at current total output.
    paybackS: perUnit > 0 ? cost / (perUnit * count) : Infinity,
  };
}

export function buildingUnlocked(state, index) {
  if (index === 0) return true;
  if (state.buildings[index].owned > 0) return true;
  const prior = state.buildings[index - 1].owned;
  return prior > 0 && state.lifetimeFrames >= BUILDINGS[index].baseCost * 0.25;
}

export function isUpgradeOwned(state, upgrade) {
  if (upgrade.kind === 'building') return !!state.buildingUpgrades[upgrade.key];
  if (upgrade.effect) return !!state.chipUpgrades[upgrade.key];
  if (GLOBAL_UPGRADES.includes(upgrade)) return !!state.globalUpgrades[upgrade.key];
  return !!state.clickUpgrades[upgrade.key];
}

export function isUpgradeAvailable(state, upgrade) {
  if (upgrade.kind === 'building') {
    return state.buildings[upgrade.buildingIndex].owned >= upgrade.threshold;
  }
  if (upgrade.requires && !state.clickUpgrades[upgrade.requires]) return false;
  return state.lifetimeFrames >= (upgrade.lifetimeReq ?? 0);
}

export function isUpgradeVisible(state, upgrade) {
  if (isUpgradeOwned(state, upgrade)) return false;
  if (upgrade.kind === 'building') {
    const owned = state.buildings[upgrade.buildingIndex].owned;
    return owned >= Math.max(1, upgrade.threshold * 0.4);
  }
  return state.lifetimeFrames >= (upgrade.lifetimeReq ?? 0) * 0.3;
}

export function upgradeStoreItems(state, category) {
  const items = [];
  for (const u of category.items) {
    if (!isUpgradeVisible(state, u)) continue;
    const available = isUpgradeAvailable(state, u);
    items.push({
      upgrade: u,
      available,
      affordable: available && state.frames >= u.cost,
    });
  }
  // Cheapest first, but locked items sink below unlocked ones.
  return items.sort((a, b) =>
    a.available === b.available ? a.upgrade.cost - b.upgrade.cost : a.available ? -1 : 1
  );
}

export function countAffordable(state, category) {
  let n = 0;
  for (const u of category.items) {
    if (isUpgradeOwned(state, u)) continue;
    if (isUpgradeAvailable(state, u) && state.frames >= u.cost) n++;
  }
  return n;
}

export function pendingAchievements(state) {
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.key] && a.check(state)) unlocked.push(a);
  }
  return unlocked;
}
