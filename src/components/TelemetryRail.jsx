import React, { useEffect, useMemo, useRef } from 'react';
import { BUILDINGS } from '../game/buildings.js';
import {
  framesPerSecond, baseFramesPerSecond, buildingOutput, clickValue,
  globalMultiplier, totalOwned, activeBuffs,
} from '../game/selectors.js';
import { formatNumber, formatMultiplier, formatDuration } from '../game/format.js';
import { useRawFrame } from '../hooks/GameProvider.jsx';

export default function TelemetryRail({ state, settings, open, onClose }) {
  const fmt = (n) => formatNumber(n, settings.numberFormat);

  const fps = framesPerSecond(state);
  const base = baseFramesPerSecond(state);
  const buffed = activeBuffs(state).some((b) => b.kind === 'production');

  const contributions = useMemo(() => {
    const rows = BUILDINGS
      .map((b, i) => ({ name: b.name, hue: b.hue, output: buildingOutput(state, i), owned: state.buildings[i].owned }))
      .filter((r) => r.owned > 0);
    rows.sort((a, b) => b.output - a.output);
    const total = rows.reduce((s, r) => s + r.output, 0) || 1;
    return rows.slice(0, 6).map((r) => ({ ...r, share: r.output / total }));
  }, [state]);

  return (
    <aside className="telemetry" data-open={open} aria-label="Telemetry">
      <section className="rail-section">
        <h2 className="rail-heading">
          Output
          {buffed && <small>boosted</small>}
        </h2>

        <div className={`rate-readout${buffed ? ' rate-boosted' : ''}`}>
          <span className="rate-value tnum">{fmt(fps)}</span>
          <span className="rate-unit">frames / sec</span>
        </div>
        {buffed && (
          <div className="rate-base">{fmt(base)} / sec without active chip effects</div>
        )}

      </section>

      <section className="rail-section">
        <h2 className="rail-heading">
          Contribution
          <small>{contributions.length ? 'by tier' : ''}</small>
        </h2>

        {contributions.length === 0 ? (
          <p className="rail-empty">
            No hardware yet. Click the die to earn your first frames, then buy a
            GeForce 256 from the store.
          </p>
        ) : (
          contributions.map((row) => (
            <div className="contrib-row" key={row.name}>
              <span className="contrib-name">{row.name}</span>
              <span className="contrib-pct tnum">{(row.share * 100).toFixed(0)}%</span>
              <span className="contrib-bar">
                <span
                  className="contrib-fill"
                  style={{
                    transform: `scaleX(${row.share})`,
                    background: `hsl(${row.hue} 65% 45%)`,
                  }}
                />
              </span>
            </div>
          ))
        )}
      </section>

      <section className="rail-section">
        <h2 className="rail-heading">Session</h2>
        <dl className="stat-list">
          <Pair label="Per click" value={fmt(clickValue(state))} tone="mint" />
          <Pair label="Global multiplier" value={formatMultiplier(globalMultiplier(state))} />
          <Pair label="GPUs owned" value={totalOwned(state).toLocaleString('en-US')} />
          <Pair label="Driver Points" value={state.driverPoints.toLocaleString('en-US')} tone="violet" />
          <Pair label="Chips caught" value={state.chipsCollected.toLocaleString('en-US')} tone="amber" />
          <Pair label="Playtime" value={formatDuration(state.playtimeS)} />
        </dl>
      </section>

      {open && <button type="button" className="scrim" aria-label="Close telemetry" onClick={onClose} />}
    </aside>
  );
}

function Pair({ label, value, tone }) {
  return (
    <div className="stat-pair">
      <dt>{label}</dt>
      <dd data-tone={tone} className="tnum">{value}</dd>
    </div>
  );
}

function draw(canvas, data) {
  if (!canvas || data.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  const logs = data.map((v) => (v > 0 ? Math.log10(v + 1) : 0));
  const max = Math.max(...logs, 0.001);
  const min = Math.min(...logs);
  const span = Math.max(max - min, 0.35); // keep a flat line off the floor

  const pt = (i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((logs[i] - min) / span) * (h - 8),
  ];

  // Fill under the curve
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let i = 0; i < data.length; i++) ctx.lineTo(...pt(i));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(69, 240, 176, 0.12)';
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const [x, y] = pt(i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#45f0b0';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
