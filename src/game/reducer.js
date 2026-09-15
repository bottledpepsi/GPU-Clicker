import { BUILDINGS, bulkCost, maxAffordable } from './buildings.js';
import {
  BUILDING_UPGRADES, CLICK_UPGRADES, GLOBAL_UPGRADES, CHIP_UPGRADES,
} from './upgrades.js';
import { CHIP_CONFIG, chipEffectById } from './chips.js';
import { defaultState } from './state.js';
import {
  clickValue, framesPerSecond, driverPointsFor, chipMagnitudeBonus,
  isUpgradeAvailable, pendingAchievements,
} from './selectors.js';

const UPGRADE_LOOKUP = new Map();
for (const u of BUILDING_UPGRADES) UPGRADE_LOOKUP.set(u.key, { u, slot: 'buildingUpgrades' });
for (const u of CLICK_UPGRADES) UPGRADE_LOOKUP.set(u.key, { u, slot: 'clickUpgrades' });
for (const u of GLOBAL_UPGRADES) UPGRADE_LOOKUP.set(u.key, { u, slot: 'globalUpgrades' });
for (const u of CHIP_UPGRADES) UPGRADE_LOOKUP.set(u.key, { u, slot: 'chipUpgrades' });

export function lookupUpgrade(key) {
  return UPGRADE_LOOKUP.get(key);
}

function earn(state, amount) {
  return {
    ...state,
    frames: state.frames + amount,
    lifetimeFrames: state.lifetimeFrames + amount,
    lifetimeFramesAllTime: state.lifetimeFramesAllTime + amount,
  };
}

export function reduce(state, action, events = []) {
  switch (action.type) {
    case 'tick': {
      const { dt, now } = action; // dt in seconds
      const fps = framesPerSecond(state, now);
      let next = state;

      if (fps > 0 && dt > 0) next = earn(state, fps * dt);
      else next = { ...state };

      next.playtimeS = state.playtimeS + dt;
      if (fps > next.peakFps) next.peakFps = fps;

      // Expire buffs, emitting one event per expiry so the UI can react.
      if (next.activeBuffs.length) {
        const live = next.activeBuffs.filter((b) => b.expiresAt > now);
        if (live.length !== next.activeBuffs.length) {
          for (const b of next.activeBuffs) {
            if (b.expiresAt <= now) events.push({ type: 'buffExpired', buff: b });
          }
          next.activeBuffs = live;
        }
      }

      return checkAchievements(next, events);
    }

    case 'click': {
      const value = clickValue(state, action.now);
      let next = earn(state, value);
      next.totalClicks = state.totalClicks + 1;
      next.framesFromClicks = state.framesFromClicks + value;
      events.push({ type: 'click', value, x: action.x, y: action.y });
      return checkAchievements(next, events);
    }

    case 'buyBuilding': {
      const { index, quantity } = action;
      const building = BUILDINGS[index];
      const owned = state.buildings[index].owned;
      const count = quantity === 'max'
        ? maxAffordable(building, owned, state.frames)
        : quantity;

      if (count <= 0) return state;
      const cost = bulkCost(building, owned, count);
      if (state.frames < cost) return state;

      const buildings = state.buildings.slice();
      buildings[index] = { owned: owned + count };

      const next = { ...state, frames: state.frames - cost, buildings };
      events.push({ type: 'buy', index, count, cost, kind: 'building' });
      return checkAchievements(next, events);
    }

    case 'buyUpgrade': {
      const entry = UPGRADE_LOOKUP.get(action.key);
      if (!entry) return state;
      const { u, slot } = entry;

      if (state[slot][u.key]) return state;
      if (!isUpgradeAvailable(state, u)) return state;
      if (state.frames < u.cost) return state;

      const next = {
        ...state,
        frames: state.frames - u.cost,
        [slot]: { ...state[slot], [u.key]: true },
      };
      events.push({ type: 'buy', kind: 'upgrade', upgrade: u, cost: u.cost });
      return checkAchievements(next, events);
    }

    case 'collectChip': {
      const { effectId, now } = action;
      const effect = chipEffectById(effectId);
      const magnitude = chipMagnitudeBonus(state);

      const withinWindow = now - state.lastChipCaughtAt <= CHIP_CONFIG.STREAK_WINDOW_S * 1000;
      const streak = withinWindow ? state.chipStreak + 1 : 1;

      let next = {
        ...state,
        chipsCollected: state.chipsCollected + 1,
        chipStreak: streak,
        bestChipStreak: Math.max(state.bestChipStreak, streak),
        lastChipCaughtAt: now,
      };

      if (effect.kind === 'instant') {
        const fps = framesPerSecond(state, now);
        const gained = Math.max(
          fps * CHIP_CONFIG.LUCKY_SECONDS,
          state.frames * CHIP_CONFIG.LUCKY_FRACTION
        ) * magnitude;
        next = earn(next, gained);
        events.push({ type: 'chip', effect, gained, x: action.x, y: action.y });
      } else {
        // Magnitude scales the bonus portion, not the whole multiplier, so
        // upgrades never turn a x3 into a x4.5 by accident.
        const mult = 1 + (effect.mult - 1) * magnitude;
        const duration = effect.durationS * magnitude;
        next.activeBuffs = [
          ...state.activeBuffs,
          {
            effectId: effect.id,
            kind: effect.kind,
            mult,
            label: effect.label,
            startedAt: now,
            expiresAt: now + duration * 1000,
          },
        ];
        events.push({ type: 'chip', effect, mult, duration, x: action.x, y: action.y });
      }

      return checkAchievements(next, events);
    }

    case 'missChip': {
      return {
        ...state,
        chipsMissed: state.chipsMissed + 1,
        chipStreak: 0,
      };
    }

    case 'prestige': {
      const potential = driverPointsFor(state.lifetimeFrames);
      if (potential <= state.driverPoints) return state;

      const fresh = defaultState();
      const next = {
        ...fresh,
        // Persist across resets.
        driverPoints: potential,
        prestigeCount: state.prestigeCount + 1,
        achievements: { ...state.achievements },
        lifetimeFramesAllTime: state.lifetimeFramesAllTime,
        totalClicks: state.totalClicks,
        framesFromClicks: state.framesFromClicks,
        chipsCollected: state.chipsCollected,
        chipsMissed: state.chipsMissed,
        bestChipStreak: state.bestChipStreak,
        peakFps: state.peakFps,
        playtimeS: state.playtimeS,
        longestOfflineS: state.longestOfflineS,
        startedAt: state.startedAt,
        // Click upgrades survive: they are a cheap early investment and
        // re-buying them every reset is busywork, not a decision.
        clickUpgrades: { ...state.clickUpgrades },
      };

      events.push({
        type: 'prestige',
        gained: potential - state.driverPoints,
        total: potential,
      });
      return checkAchievements(next, events);
    }

    case 'offline': {
      const { seconds, earned } = action;
      let next = earn(state, earned);
      next.playtimeS = state.playtimeS; // time away is not playtime
      next.longestOfflineS = Math.max(state.longestOfflineS, seconds);
      return checkAchievements(next, events);
    }

    case 'replaceState':
      return action.state;

    case 'hardReset':
      return defaultState();

    default:
      return state;
  }
}

function checkAchievements(state, events) {
  const unlocked = pendingAchievements(state);
  if (!unlocked.length) return state;

  const achievements = { ...state.achievements };
  for (const a of unlocked) {
    achievements[a.key] = true;
    events.push({ type: 'achievement', achievement: a });
  }
  return { ...state, achievements };
}
