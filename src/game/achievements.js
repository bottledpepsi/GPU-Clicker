import { BUILDINGS } from './buildings.js';
import { formatNumber } from './format.js';

const totalOwned = (s) => s.buildings.reduce((a, b) => a + b.owned, 0);

function build() {
  const list = [];

  const lifetime = [1e3, 1e5, 1e7, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27];
  lifetime.forEach((m, i) =>
    list.push({
      key: `ach_life_${i}`,
      group: 'Output',
      name: `${formatNumber(m)} Frames`,
      desc: `Render ${formatNumber(m)} frames in total.`,
      check: (s) => s.lifetimeFrames >= m,
    })
  );

  const clicks = [100, 1_000, 10_000, 100_000, 1_000_000];
  clicks.forEach((m, i) =>
    list.push({
      key: `ach_click_${i}`,
      group: 'Clicks',
      name: `${formatNumber(m)} Clicks`,
      desc: `Click the die ${m.toLocaleString('en-US')} times.`,
      check: (s) => s.totalClicks >= m,
    })
  );

  const owned = [10, 50, 150, 400, 1_000, 2_500];
  owned.forEach((m, i) =>
    list.push({
      key: `ach_owned_${i}`,
      group: 'Hardware',
      name: `${m.toLocaleString('en-US')} GPUs`,
      desc: `Own ${m.toLocaleString('en-US')} GPUs across all tiers.`,
      check: (s) => totalOwned(s) >= m,
    })
  );

  // One per tier, for reaching the first milestone of that tier.
  BUILDINGS.forEach((b, i) => {
    list.push({
      key: `ach_tier_${i}`,
      group: 'Hardware',
      name: b.name,
      desc: `Own 25 ${b.name}.`,
      check: (s) => s.buildings[i].owned >= 25,
    });
  });

  [
    [1, 'Lucky Find', 'Catch your first Golden Chip.'],
    [25, 'Chip Connoisseur', 'Catch 25 Golden Chips.'],
    [200, 'Shimmer Hunter', 'Catch 200 Golden Chips.'],
  ].forEach(([n, name, desc], i) =>
    list.push({
      key: `ach_chip_${i}`,
      group: 'Chips',
      name,
      desc,
      check: (s) => s.chipsCollected >= n,
    })
  );

  [5, 15].forEach((n, i) =>
    list.push({
      key: `ach_streak_${i}`,
      group: 'Chips',
      name: `${n}-Chip Streak`,
      desc: `Catch ${n} Golden Chips in a row without missing one.`,
      check: (s) => s.bestChipStreak >= n,
    })
  );

  [1, 5, 15, 50].forEach((n, i) =>
    list.push({
      key: `ach_prestige_${i}`,
      group: 'Drivers',
      name: n === 1 ? 'Clean Install' : `Driver Update x${n}`,
      desc: `Perform ${n} Driver Update${n > 1 ? 's' : ''}.`,
      check: (s) => s.prestigeCount >= n,
    })
  );

  [100, 1_000, 10_000].forEach((n, i) =>
    list.push({
      key: `ach_points_${i}`,
      group: 'Drivers',
      name: `${formatNumber(n)} Driver Points`,
      desc: `Hold ${n.toLocaleString('en-US')} Driver Points at once.`,
      check: (s) => s.driverPoints >= n,
    })
  );

  list.push({
    key: 'ach_idle_1',
    group: 'Odd',
    name: 'Left It Rendering',
    desc: 'Return after being away for over 8 hours.',
    check: (s) => s.longestOfflineS >= 8 * 3600,
  });
  list.push({
    key: 'ach_patient',
    group: 'Odd',
    name: 'Uptime',
    desc: 'Play for 24 hours in total.',
    check: (s) => s.playtimeS >= 86400,
  });

  return list;
}

export const ACHIEVEMENTS = build();

export const ACHIEVEMENT_GROUPS = [...new Set(ACHIEVEMENTS.map((a) => a.group))];
