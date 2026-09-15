import React from 'react';
import Modal from './Modal.jsx';
import { BUILDINGS } from '../game/buildings.js';
import { ACHIEVEMENTS } from '../game/achievements.js';
import {
  framesPerSecond, clickValue, globalMultiplier, driverMultiplier,
  totalOwned, chipIntervalS, framesForNextPoint, prestigeGain,
} from '../game/selectors.js';
import {
  formatNumber, formatMultiplier, formatDuration,
} from '../game/format.js';

export default function StatsModal({ state, onClose, numberFormat }) {
  const fmt = (n) => formatNumber(n, numberFormat);
  const fps = framesPerSecond(state);
  const owned = totalOwned(state);
  const chipTotal = state.chipsCollected + state.chipsMissed;
  const catchRate = chipTotal > 0 ? (state.chipsCollected / chipTotal) * 100 : 0;
  const clickShare = state.lifetimeFramesAllTime > 0
    ? (state.framesFromClicks / state.lifetimeFramesAllTime) * 100
    : 0;

  return (
    <Modal title="Statistics" onClose={onClose} wide>
      <div className="stats-columns">
        <Block title="Production">
          <Stat label="Frames in bank" value={fmt(state.frames)} />
          <Stat label="Lifetime frames" value={fmt(state.lifetimeFrames)} />
          <Stat label="All-time frames" value={fmt(state.lifetimeFramesAllTime)} />
          <Stat label="Current output" value={`${fmt(fps)} /sec`} />
          <Stat label="Peak output" value={`${fmt(state.peakFps)} /sec`} />
          <Stat label="Global multiplier" value={formatMultiplier(globalMultiplier(state))} />
        </Block>

        <Block title="Clicking">
          <Stat label="Total clicks" value={state.totalClicks.toLocaleString('en-US')} />
          <Stat label="Value per click" value={fmt(clickValue(state))} />
          <Stat label="Frames from clicks" value={fmt(state.framesFromClicks)} />
          <Stat label="Share of all output" value={`${clickShare.toFixed(2)}%`} />
        </Block>

        <Block title="Hardware">
          <Stat label="GPUs owned" value={owned.toLocaleString('en-US')} />
          <Stat label="Tiers unlocked" value={`${BUILDINGS.filter((_, i) => state.buildings[i].owned > 0).length} / ${BUILDINGS.length}`} />
          <Stat label="Tier upgrades" value={Object.keys(state.buildingUpgrades).length} />
          <Stat label="Global upgrades" value={Object.keys(state.globalUpgrades).length} />
          <Stat label="Click upgrades" value={Object.keys(state.clickUpgrades).length} />
        </Block>

        <Block title="Golden Chips">
          <Stat label="Caught" value={state.chipsCollected.toLocaleString('en-US')} />
          <Stat label="Missed" value={state.chipsMissed.toLocaleString('en-US')} />
          <Stat label="Catch rate" value={`${catchRate.toFixed(0)}%`} />
          <Stat label="Best streak" value={state.bestChipStreak.toLocaleString('en-US')} />
          <Stat label="Current streak" value={state.chipStreak.toLocaleString('en-US')} />
          <Stat label="Average interval" value={`~${Math.round(chipIntervalS(state))}s`} />
        </Block>

        <Block title="Drivers">
          <Stat label="Driver Points" value={state.driverPoints.toLocaleString('en-US')} />
          <Stat label="From points" value={formatMultiplier(driverMultiplier(state))} />
          <Stat label="Updates performed" value={state.prestigeCount.toLocaleString('en-US')} />
          <Stat label="Points available now" value={`+${prestigeGain(state).toLocaleString('en-US')}`} />
          <Stat label="Next point at" value={fmt(framesForNextPoint(state))} />
        </Block>

        <Block title="Time">
          <Stat label="Playtime" value={formatDuration(state.playtimeS)} />
          <Stat label="Longest time away" value={formatDuration(state.longestOfflineS)} />
          <Stat label="Started" value={new Date(state.startedAt).toLocaleDateString()} />
          <Stat
            label="Achievements"
            value={`${Object.keys(state.achievements).length} / ${ACHIEVEMENTS.length}`}
          />
        </Block>
      </div>
    </Modal>
  );
}

function Block({ title, children }) {
  return (
    <section className="stats-block">
      <h3>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-pair">
      <dt>{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  );
}
