import React from 'react';
import Modal from './Modal.jsx';
import { formatNumber, formatElapsed, formatDuration } from '../game/format.js';
import { OFFLINE } from '../game/state.js';

export default function OfflineModal({ report, onClose, numberFormat }) {
  const fmt = (n) => formatNumber(n, numberFormat);

  return (
    <Modal
      title="Welcome back"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
          Collect
        </button>
      }
    >
      <div className="offline-figure">
        <div className="offline-amount tnum">+{fmt(report.earned)}</div>
        <p className="offline-caption">
          frames rendered while you were away
        </p>
      </div>

      <p className="offline-caption" style={{ textAlign: 'center' }}>
        You were gone for {formatElapsed(report.elapsedS)}. Your rig kept running
        at {fmt(report.rate)} frames per second, earning{' '}
        {Math.round(report.efficiency * 100)}% of its normal rate
        {report.capped
          ? `, counted up to the ${OFFLINE.MAX_HOURS}-hour maximum (${formatDuration(report.cappedS)}).`
          : '.'}
      </p>
    </Modal>
  );
}
