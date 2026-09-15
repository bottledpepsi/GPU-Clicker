import React, { useState } from 'react';
import Modal from './Modal.jsx';
import {
  prestigeGain, driverMultiplier, framesForNextPoint,
} from '../game/selectors.js';
import { formatNumber, formatMultiplier } from '../game/format.js';

export default function PrestigeModal({ state, dispatch, onClose, numberFormat }) {
  const [confirmed, setConfirmed] = useState(false);
  const fmt = (n) => formatNumber(n, numberFormat);

  const gain = prestigeGain(state);
  const current = state.driverPoints;
  const after = current + gain;

  const currentMult = driverMultiplier(state);
  const afterMult = driverMultiplier({ ...state, driverPoints: after });
  const relativeGain = currentMult > 0 ? afterMult / currentMult : 1;

  const nextThreshold = framesForNextPoint(state);

  // Advice thresholds: below +10% the reset almost never pays back before
  // you would have reached the same output by just continuing.
  let advice;
  let tone = 'good';
  if (gain === 0) {
    advice = `You have not earned any new Driver Points yet. The next one arrives at ${fmt(nextThreshold)} lifetime frames.`;
    tone = 'warn';
  } else if (relativeGain < 1.1) {
    advice = `This would raise your permanent multiplier by ${((relativeGain - 1) * 100).toFixed(1)}%. That is usually not worth resetting for — most players wait until a Driver Update is worth at least +50%.`;
    tone = 'warn';
  } else if (relativeGain < 1.5) {
    advice = `This would raise your permanent multiplier by ${((relativeGain - 1) * 100).toFixed(0)}%. Reasonable, though waiting a little longer compounds quickly.`;
  } else {
    advice = `This would raise your permanent multiplier by ${((relativeGain - 1) * 100).toFixed(0)}%. A strong time to update.`;
  }

  const run = () => {
    dispatch({ type: 'prestige' });
    onClose();
  };

  return (
    <Modal
      title="Driver Update"
      subtitle={`${state.prestigeCount} update${state.prestigeCount === 1 ? '' : 's'} performed`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Not yet</button>
          <button
            type="button"
            className="btn btn--violet btn--block"
            disabled={gain === 0 || !confirmed}
            onClick={run}
          >
            {gain === 0 ? 'No points available' : `Update drivers for ${gain.toLocaleString('en-US')} points`}
          </button>
        </>
      }
    >
      <p className="prestige-lede">
        A driver update wipes your frames, every GPU you own, and your tier,
        global and chip upgrades. In exchange it converts lifetime frames into
        Driver Points, and each point permanently adds +1% to everything you
        produce. Achievements, click upgrades and your statistics survive.
      </p>

      <dl className="prestige-figures">
        <div className="prestige-figure">
          <dt>Points now</dt>
          <dd className="tnum">{current.toLocaleString('en-US')}</dd>
        </div>
        <div className="prestige-figure" data-highlight={gain > 0}>
          <dt>Points gained</dt>
          <dd className="tnum">+{gain.toLocaleString('en-US')}</dd>
        </div>
        <div className="prestige-figure">
          <dt>Multiplier</dt>
          <dd className="tnum">
            {formatMultiplier(currentMult)} → {formatMultiplier(afterMult)}
          </dd>
        </div>
      </dl>

      <div className="prestige-advice" data-tone={tone}>{advice}</div>

      <label className="confirm-box">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>
          I understand this resets my frames, GPUs and most upgrades, and that
          it cannot be undone.
        </span>
      </label>
    </Modal>
  );
}
