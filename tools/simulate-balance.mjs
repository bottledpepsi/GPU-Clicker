/**
 * Playtest-by-simulation.
 *
 * Runs a greedy-optimal player against the *actual shipped game modules*, so
 * this cannot drift from the real balance the way a hand-maintained
 * spreadsheet would. Run with `npm run balance`.
 *
 * The player buys whatever has the shortest payback time at that moment,
 * clicks 3 times a second for the first three minutes and then goes idle.
 * That approximates someone who plays actively for a bit and then leaves the
 * tab open, which is how this genre is actually consumed.
 *
 * Two questions it exists to answer:
 *   1. Is a new player ever stuck with nothing to buy for an unreasonable time?
 *   2. Does the greedy optimum spread purchases across tiers, or does one
 *      tier dominate? Pooling means the cost/output relationship is broken.
 */

import { BUILDINGS, unitCost } from '../src/game/buildings.js';
import { BUILDING_UPGRADES, GLOBAL_UPGRADES, CLICK_UPGRADES } from '../src/game/upgrades.js';
import { defaultState } from '../src/game/state.js';
import {
  framesPerSecond, clickValue, buildingUnitOutput, globalMultiplier,
  isUpgradeAvailable,
} from '../src/game/selectors.js';
import { formatNumber, formatDuration } from '../src/game/format.js';

const CLICK_WINDOW_S = 180;
const CLICKS_PER_S = 3;
const HORIZON_S = 60 * 60 * 24 * 14; // two weeks

function simulate() {
  const state = defaultState();
  let t = 0;
  const log = [];
  const magnitudeSeen = new Set();

  let guard = 0;
  while (t < HORIZON_S && guard++ < 200_000) {
    const fps = framesPerSecond(state, 0);
    const options = [];

    // Buildings
    BUILDINGS.forEach((b, i) => {
      const cost = unitCost(b, state.buildings[i].owned);
      const gain = buildingUnitOutput(state, i, 0);
      if (gain > 0) options.push({ cost, payback: cost / gain, apply: () => state.buildings[i].owned++ });
    });

    // Milestone upgrades
    for (const u of BUILDING_UPGRADES) {
      if (state.buildingUpgrades[u.key]) continue;
      if (!isUpgradeAvailable(state, u)) continue;
      const current = state.buildings[u.buildingIndex].owned * buildingUnitOutput(state, u.buildingIndex, 0);
      const gain = current * (u.multiplier - 1);
      if (gain > 0) options.push({ cost: u.cost, payback: u.cost / gain, apply: () => { state.buildingUpgrades[u.key] = true; } });
    }

    // Global upgrades
    for (const u of GLOBAL_UPGRADES) {
      if (state.globalUpgrades[u.key] || u.special) continue;
      if (!isUpgradeAvailable(state, u)) continue;
      const gain = fps * (u.mult - 1);
      if (gain > 0) options.push({ cost: u.cost, payback: u.cost / gain, apply: () => { state.globalUpgrades[u.key] = true; } });
    }

    // Click upgrades: only valued during the active-clicking window.
    if (t < CLICK_WINDOW_S) {
      for (const u of CLICK_UPGRADES) {
        if (state.clickUpgrades[u.key] || u.special) continue;
        if (!isUpgradeAvailable(state, u)) continue;
        const gain = clickValue(state, 0) * (u.mult - 1) * CLICKS_PER_S;
        if (gain > 0) options.push({ cost: u.cost, payback: u.cost / gain, apply: () => { state.clickUpgrades[u.key] = true; } });
      }
    }

    if (!options.length) break;
    options.sort((a, b) => a.payback - b.payback);
    const pick = options[0];

    // Advance time until affordable.
    const clicking = t < CLICK_WINDOW_S;
    const income = fps + (clicking ? clickValue(state, 0) * CLICKS_PER_S : 0);
    const deficit = pick.cost - state.frames;

    if (deficit > 0) {
      if (income <= 0) break;
      const wait = deficit / income;
      t += wait;
      state.frames += income * wait;
      state.lifetimeFrames += income * wait;

      if (wait > 600) {
        log.push({ t, kind: 'stall', wait, cost: pick.cost });
      }
    }

    state.frames -= pick.cost;
    pick.apply();

    // Record the first time output crosses each order of magnitude.
    const newFps = framesPerSecond(state, 0);
    const mag = Math.floor(Math.log10(Math.max(1, newFps)));
    if (newFps > 1 && !magnitudeSeen.has(mag)) {
      magnitudeSeen.add(mag);
      log.push({ t, kind: 'magnitude', mag, fps: newFps });
    }
  }

  return { state, t, log };
}

/* ───────────────────────────── Report ───────────────────────────── */

const { state, t, log } = simulate();

console.log('\nGPU CLICKER — BALANCE SIMULATION');
console.log('Greedy-optimal player, 3 clicks/sec for the first 3 minutes, idle after.\n');

console.log('Time to reach each order of magnitude of output:');
console.log('  output        elapsed        gap from previous');
let prev = 0;
for (const entry of log.filter((e) => e.kind === 'magnitude')) {
  const gap = entry.t - prev;
  console.log(
    `  1e${String(entry.mag).padEnd(3)} f/s   ${formatDuration(entry.t).padEnd(13)} +${formatDuration(gap)}`
  );
  prev = entry.t;
}

const stalls = log.filter((e) => e.kind === 'stall');
console.log(`\nStalls over 10 minutes with nothing affordable: ${stalls.length}`);
for (const s of stalls.slice(0, 6)) {
  console.log(`  at ${formatDuration(s.t)} — waited ${formatDuration(s.wait)} for ${formatNumber(s.cost)} frames`);
}

console.log('\nFinal distribution of purchases across tiers:');
const owned = state.buildings.map((b) => b.owned);
const maxOwned = Math.max(...owned, 1);
BUILDINGS.forEach((b, i) => {
  const bar = '█'.repeat(Math.round((owned[i] / maxOwned) * 28));
  console.log(`  ${b.name.padEnd(26)} ${String(owned[i]).padStart(4)}  ${bar}`);
});

const spread = Math.min(...owned) / Math.max(...owned, 1);
console.log(`\nTier spread (min/max owned): ${(spread * 100).toFixed(0)}%`);
console.log(spread > 0.35
  ? '  Healthy — no single tier dominates the optimal build.'
  : '  Warning — purchases are pooling, check the cost/output ratio between tiers.');

console.log(`\nSimulated ${formatDuration(t)} of play.`);
console.log(`Final output: ${formatNumber(framesPerSecond(state, 0))} frames/sec`);
console.log(`Global multiplier: x${formatNumber(globalMultiplier(state, 0))}`);
console.log(`Lifetime frames: ${formatNumber(state.lifetimeFrames)}\n`);
