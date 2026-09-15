export const COST_GROWTH = 1.15;

export const MAX_BULK = 100000;

export const BUILDINGS = [
  {
    id: 'gpu0',
    name: 'GeForce 256',
    tagline: 'The first one anybody called a GPU.',
    baseCost: 15,
    baseFps: 0.1,
    hue: 100,
  },
  {
    id: 'gpu1',
    name: 'GeForce 2 MX',
    tagline: 'Budget silicon, stacked deep.',
    baseCost: 100,
    baseFps: 1,
    hue: 118,
  },
  {
    id: 'gpu2',
    name: 'GeForce FX 5200',
    tagline: 'Loud, hot, and yours.',
    baseCost: 1_100,
    baseFps: 8,
    hue: 136,
  },
  {
    id: 'gpu3',
    name: 'GeForce 7800 GTX',
    tagline: 'Shader model 3 and a lot of confidence.',
    baseCost: 12_000,
    baseFps: 47,
    hue: 152,
  },
  {
    id: 'gpu4',
    name: 'GeForce 8800 GTS',
    tagline: 'Unified shaders change everything.',
    baseCost: 130_000,
    baseFps: 260,
    hue: 166,
  },
  {
    id: 'gpu5',
    name: 'GeForce GTX 670',
    tagline: 'The sensible enthusiast pick.',
    baseCost: 1_400_000,
    baseFps: 1_400,
    hue: 178,
  },
  {
    id: 'gpu6',
    name: 'GeForce GTX 1080 Ti',
    tagline: 'Refuses to become obsolete.',
    baseCost: 20_000_000,
    baseFps: 7_800,
    hue: 190,
  },
  {
    id: 'gpu7',
    name: 'GeForce RTX 2080 Ti',
    tagline: 'Ray tracing, at last.',
    baseCost: 330_000_000,
    baseFps: 44_000,
    hue: 202,
  },
  {
    id: 'gpu8',
    name: 'GeForce RTX 3090',
    tagline: 'Twenty-four gigabytes of ambition.',
    baseCost: 5_100_000_000,
    baseFps: 260_000,
    hue: 214,
  },
  {
    id: 'gpu9',
    name: 'GeForce RTX 4090',
    tagline: 'Bring your own power supply.',
    baseCost: 75_000_000_000,
    baseFps: 1_600_000,
    hue: 226,
  },
  {
    id: 'gpu10',
    name: 'GeForce RTX 5090',
    tagline: 'The rack is starting to sag.',
    baseCost: 1_100_000_000_000,
    baseFps: 10_000_000,
    hue: 240,
  },
  {
    id: 'gpu11',
    name: 'Blackwell Ultra Node',
    tagline: 'No longer a consumer product.',
    baseCost: 1.6e13,
    baseFps: 64_000_000,
    hue: 256,
  },
  {
    id: 'gpu12',
    name: 'Titan Datacenter',
    tagline: 'Measured in megawatts.',
    baseCost: 2.3e14,
    baseFps: 420_000_000,
    hue: 272,
  },
  {
    id: 'gpu13',
    name: 'Quantum Tensor Core',
    tagline: 'The future of graphics rendering.',
    baseCost: 3.4e15,
    baseFps: 2.8e9,
    hue: 288,
  },
  {
    id: 'gpu14',
    name: 'Dyson Sphere Render Farm',
    tagline: 'Predicts frames before they are needed.',
    baseCost: 5e16,
    baseFps: 1.9e10,
    hue: 38,
  },
];

export function unitCost(building, owned) {
  return Math.ceil(building.baseCost * Math.pow(COST_GROWTH, owned));
}

export function bulkCost(building, owned, count) {
  if (count <= 0) return 0;
  const first = building.baseCost * Math.pow(COST_GROWTH, owned);
  const sum = first * (Math.pow(COST_GROWTH, count) - 1) / (COST_GROWTH - 1);
  return Math.ceil(sum);
}

export function maxAffordable(building, owned, frames) {
  if (!Number.isFinite(frames) || frames <= 0) return 0;
  if (frames < unitCost(building, owned)) return 0;

  const first = building.baseCost * Math.pow(COST_GROWTH, owned);
  const ratio = (frames * (COST_GROWTH - 1)) / first + 1;
  let n = Math.floor(Math.log(ratio) / Math.log(COST_GROWTH));
  if (!Number.isFinite(n)) return MAX_BULK;

  n = Math.min(Math.max(n, 0), MAX_BULK);
  while (n > 0 && bulkCost(building, owned, n) > frames) n--;
  while (n < MAX_BULK && bulkCost(building, owned, n + 1) <= frames) n++;
  return n;
}
