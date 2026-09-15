import { BUILDINGS } from './buildings.js';

export const BUILDING_MILESTONES = [
  { threshold: 1, mult: 2, suffix: 'Mk.II' },
  { threshold: 25, mult: 2, suffix: 'Mk.III' },
  { threshold: 50, mult: 2, suffix: 'Mk.IV' },
  { threshold: 100, mult: 3, suffix: 'Mk.V' },
  { threshold: 200, mult: 3, suffix: 'Mk.VI' },
  { threshold: 300, mult: 3, suffix: 'Mk.VII' },
];

export const BUILDING_UPGRADES = BUILDINGS.flatMap((b, buildingIndex) =>
  BUILDING_MILESTONES.map((m, tier) => ({
    key: `bu_${buildingIndex}_${tier}`,
    kind: 'building',
    buildingIndex,
    tier,
    threshold: m.threshold,
    multiplier: m.mult,
    name: `${b.name} ${m.suffix}`,
    desc: `x${m.mult} output from every ${b.name}.`,
    unlockText: `Own ${m.threshold} ${b.name}`,
    cost: Math.ceil(b.baseCost * (m.threshold * 9 + 30) * Math.pow(2.1, tier)),
  }))
);

export const CLICK_UPGRADES = [
  {
    key: 'click0', name: 'Gaming Mouse', mult: 2,
    cost: 1_500, lifetimeReq: 0,
    desc: 'Double frames per click.',
  },
  {
    key: 'click1', name: 'Mechanical Keyboard', mult: 2,
    cost: 30_000, lifetimeReq: 10_000,
    desc: 'Double frames per click.',
  },
  {
    key: 'click2', name: 'Polling Rate Overdrive', mult: 2,
    cost: 900_000, lifetimeReq: 250_000,
    desc: 'Double frames per click.',
  },
  {
    key: 'click3', name: 'Neural Click Interface', mult: 3,
    cost: 6_000_000, lifetimeReq: 2_000_000,
    desc: 'x3 frames per click.',
  },
  {
    key: 'clickSynergy', name: 'Click Production Synergy', special: 'perBuilding',
    cost: 5e9, lifetimeReq: 1e9,
    desc: 'Each GPU you own adds +1% to click power.',
  },
  {
    key: 'click4', name: 'Turbo Neural Click', mult: 3,
    cost: 800_000_000, lifetimeReq: 3e8,
    desc: 'x3 frames per click.',
  },
  {
    key: 'clickIdle', name: 'Predictive Frame Buffer', special: 'perFps',
    cost: 2e12, lifetimeReq: 5e11,
    desc: 'Each click also earns 1 second of passive output.',
  },
  {
    key: 'click5', name: 'Omega Click Transcendence', mult: 4,
    cost: 4e11, lifetimeReq: 2e11,
    desc: 'x4 frames per click.',
  },
  {
    key: 'click6', name: 'Singularity Cursor', mult: 5,
    cost: 9e14, lifetimeReq: 5e14,
    desc: 'x5 frames per click.',
  },
  {
    key: 'clickIdle2', name: 'Speculative Rasteriser', special: 'perFps2',
    cost: 3e18, lifetimeReq: 8e17,
    desc: 'Predictive Frame Buffer is 10x stronger.',
    requires: 'clickIdle',
  },
];

export const GLOBAL_UPGRADES = [
  { key: 'g0', name: 'Thermal Paste', mult: 1.25, cost: 500, lifetimeReq: 0, desc: '+25% total output.' },
  { key: 'g1', name: 'SLI Bridge', mult: 1.5, cost: 7_500, lifetimeReq: 1_000, desc: '+50% total output.' },
  { key: 'g2', name: 'GPU Cluster Rack', mult: 2, cost: 100_000, lifetimeReq: 20_000, desc: 'x2 total output.' },
  { key: 'g3', name: 'Liquid Nitrogen Cooling', mult: 2, cost: 5_000_000, lifetimeReq: 1_000_000, desc: 'x2 total output.' },
  { key: 'g4', name: 'Quantum Cooling Loop', mult: 2.5, cost: 250_000_000, lifetimeReq: 5e7, desc: 'x2.5 total output.' },
  { key: 'g5', name: 'Phase-Change Unit', mult: 2, cost: 2.5e10, lifetimeReq: 5e9, desc: 'x2 total output.' },
  { key: 'g6', name: 'Superconductor Array', mult: 2, cost: 7e12, lifetimeReq: 1.5e12, desc: 'x2 total output.' },
  { key: 'g7', name: 'Dimensional Shader Core', mult: 3, cost: 3e14, lifetimeReq: 6e13, desc: 'x3 total output.' },
  { key: 'g8', name: 'Dark Matter Heatsink', mult: 3, cost: 1.5e17, lifetimeReq: 3e16, desc: 'x3 total output.' },
  { key: 'g9', name: 'Quantum Entanglement Mesh', mult: 4, cost: 2e19, lifetimeReq: 4e18, desc: 'x4 total output.' },
  { key: 'g10', name: 'Singularity Core', mult: 5, cost: 8e21, lifetimeReq: 1.6e21, desc: 'x5 total output.' },
  { key: 'g11', name: 'Photon Nexus Engine', mult: 6, cost: 5e24, lifetimeReq: 1e24, desc: 'x6 total output.' },
  {
    key: 'gDriver', name: 'Signed Driver Cache', special: 'perDriverPoint',
    cost: 1e9, lifetimeReq: 1e8,
    desc: 'Each Driver Point adds a further +1% to total output.',
  },
  {
    key: 'gAch', name: 'Benchmark Leaderboard', special: 'perAchievement',
    cost: 1e15, lifetimeReq: 2e14,
    desc: 'Each achievement earned adds +2% to total output.',
  },
];

export const CHIP_UPGRADES = [
  {
    key: 'chip0', name: 'Quantum Luck Module', effect: 'rate',
    cost: 500_000_000, lifetimeReq: 1e8,
    desc: 'Golden Chips appear twice as often.',
  },
  {
    key: 'chip1', name: 'Lucky Silicon', effect: 'magnitude',
    cost: 4e13, lifetimeReq: 8e12,
    desc: 'Chip effects last 50% longer and hit 50% harder.',
  },
  {
    key: 'chip2', name: 'Extended Shimmer Window', effect: 'duration',
    cost: 2e15, lifetimeReq: 5e14,
    desc: 'Chips stay on screen 8 seconds longer before fading.',
  },
  {
    key: 'chip3', name: 'Probability Render Core', effect: 'rate',
    cost: 2e18, lifetimeReq: 4e17,
    desc: 'Golden Chips appear twice as often again.',
  },
  {
    key: 'chip4', name: 'Entropy Inverter', effect: 'magnitude',
    cost: 5e21, lifetimeReq: 1e21,
    desc: 'Chip effects last 50% longer and hit 50% harder again.',
  },
];

export const ALL_UPGRADES = [
  ...BUILDING_UPGRADES,
  ...CLICK_UPGRADES,
  ...GLOBAL_UPGRADES,
  ...CHIP_UPGRADES,
];

export const UPGRADE_CATEGORIES = [
  { id: 'click', label: 'Click', items: CLICK_UPGRADES, stateKey: 'clickUpgrades' },
  { id: 'global', label: 'Global', items: GLOBAL_UPGRADES, stateKey: 'globalUpgrades' },
  { id: 'building', label: 'Tiers', items: BUILDING_UPGRADES, stateKey: 'buildingUpgrades' },
  { id: 'chip', label: 'Chips', items: CHIP_UPGRADES, stateKey: 'chipUpgrades' },
];
