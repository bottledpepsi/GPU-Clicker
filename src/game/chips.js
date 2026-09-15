export const CHIP_RARITY = {
  common: { label: 'Common', hue: 45 },
  rare: { label: 'Rare', hue: 190 },
  legendary: { label: 'Legendary', hue: 280 },
};

export const CHIP_EFFECTS = [
  {
    id: 'frenzy',
    label: 'Frame Frenzy',
    blurb: 'Total output x7',
    weight: 40,
    rarity: 'common',
    kind: 'production',
    mult: 7,
    durationS: 30,
  },
  {
    id: 'clickFrenzy',
    label: 'Click Frenzy',
    blurb: 'Click power x15',
    weight: 18,
    rarity: 'common',
    kind: 'click',
    mult: 15,
    durationS: 15,
  },
  {
    id: 'lucky',
    label: 'Lucky Chip',
    blurb: 'Instant frame payout',
    weight: 27,
    rarity: 'common',
    kind: 'instant',
  },
  {
    id: 'overclock',
    label: 'Overclock',
    blurb: 'Total output x3, long duration',
    weight: 9,
    rarity: 'rare',
    kind: 'production',
    mult: 3,
    durationS: 90,
  },
  {
    id: 'cascade',
    label: 'Render Cascade',
    blurb: 'Click power x50',
    weight: 4,
    rarity: 'rare',
    kind: 'click',
    mult: 50,
    durationS: 12,
  },
  {
    id: 'singularity',
    label: 'Thermal Singularity',
    blurb: 'Total output x40',
    weight: 2,
    rarity: 'legendary',
    kind: 'production',
    mult: 40,
    durationS: 20,
  },
];

export const CHIP_CONFIG = {
  BASE_INTERVAL_S: 90,
  MIN_INTERVAL_S: 32,
  JITTER: 0.5,          // spawn time varies +/- 50% so it never feels metronomic
  VISIBLE_S: 13,
  LUCKY_FRACTION: 0.15, // 15% of current bank...
  LUCKY_SECONDS: 20,    // ...or 20 seconds of output, whichever is larger
  STREAK_WINDOW_S: 180, // consecutive catches within this window extend a streak
};

export function pickChipEffect(random = Math.random) {
  const total = CHIP_EFFECTS.reduce((s, c) => s + c.weight, 0);
  let roll = random() * total;
  for (const effect of CHIP_EFFECTS) {
    if (roll < effect.weight) return effect;
    roll -= effect.weight;
  }
  return CHIP_EFFECTS[0];
}

export function chipEffectById(id) {
  return CHIP_EFFECTS.find((e) => e.id === id) ?? CHIP_EFFECTS[0];
}
